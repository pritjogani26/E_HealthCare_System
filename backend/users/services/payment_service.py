# backend\users\services\payment_service.py

import hashlib
import hmac

import razorpay
from django.conf import settings
from django.db import connection

from users.middleware.exceptions import (
    NotFoundException,
    PermissionException,
    ValidationException,  # add this to your exceptions if not present
)


# ─── Raw SQL helper (mirrors your existing pattern) ───────────────────────────


def _execute(sql, params=None, fetch="none"):
    with connection.cursor() as cur:
        cur.execute(sql, params or [])
        if fetch == "one":
            row = cur.fetchone()
            if row is None:
                return None
            cols = [d[0] for d in cur.description]
            return dict(zip(cols, row))
        if fetch == "all":
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, r)) for r in cur.fetchall()]
    return None


# ─── Razorpay client (lazy singleton) ─────────────────────────────────────────


def _get_razorpay_client():
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET
    if not key_id or not key_secret:
        raise ValidationException(
            "Razorpay credentials are not configured. "
            "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file."
        )
    return razorpay.Client(auth=(key_id, key_secret))


# ─── PaymentService ────────────────────────────────────────────────────────────


class PaymentService:

    # ── Helpers ────────────────────────────────────────────────────────────────

    @staticmethod
    def _fetch_appointment(reference_id, patient_id):
        row = _execute(
            """
            SELECT appointment_id, consultation_fee, patient_id, status
              FROM doctor_appointments
             WHERE appointment_id = %s
            """,
            [reference_id],
            fetch="one",
        )
        if not row:
            raise NotFoundException("Appointment not found.")
        if str(row["patient_id"]) != str(patient_id):
            raise PermissionException("You do not own this appointment.")
        if row["status"] in ("CANCELLED", "COMPLETED"):
            raise ValidationException(
                f"Cannot pay for an appointment with status '{row['status']}'."
            )
        return row

    @staticmethod
    def _fetch_lab_booking(reference_id, patient_id):
        row = _execute(
            """
            SELECT booking_id, total_amount, patient_id, booking_status
              FROM lab_test_slot_bookings
             WHERE booking_id = %s
            """,
            [reference_id],
            fetch="one",
        )
        if not row:
            raise NotFoundException("Lab booking not found.")
        if str(row["patient_id"]) != str(patient_id):
            raise PermissionException("You do not own this lab booking.")
        if row["booking_status"] in ("CANCELLED",):
            raise ValidationException(
                f"Cannot pay for a booking with status '{row['booking_status']}'."
            )
        return row

    # ── Create Order ───────────────────────────────────────────────────────────

    @staticmethod
    def create_order(validated_data, patient_id):
        payment_for = validated_data["payment_for"]
        reference_id = validated_data["reference_id"]

        # Check if a PENDING or SUCCESS payment already exists
        existing = _execute(
            """
            SELECT payment_id, status
              FROM payments
             WHERE reference_id = %s
               AND payment_for  = %s
               AND status NOT IN ('FAILED', 'REFUNDED')
            """,
            [str(reference_id), payment_for],
            fetch="one",
        )
        if existing and existing["status"] == "SUCCESS":
            raise ValidationException("This booking has already been paid.")

        # Fetch amount from correct table
        if payment_for == "APPOINTMENT":
            record = PaymentService._fetch_appointment(reference_id, patient_id)
            amount = float(record["consultation_fee"] or 0)
        else:
            record = PaymentService._fetch_lab_booking(reference_id, patient_id)
            amount = float(record["total_amount"] or 0)

        if amount <= 0:
            raise ValidationException("Payable amount must be greater than zero.")

        # Create Razorpay order
        client = _get_razorpay_client()
        receipt = f"rcpt_{str(reference_id).replace('-', '')}"[:40]

        rz_order = client.order.create(
            {
                "amount": int(amount * 100),
                "currency": "INR",
                "receipt": receipt,
                "notes": {
                    "payment_for": payment_for,
                    "reference_id": str(reference_id),
                    "patient_id": str(patient_id),
                },
            }
        )

        # Upsert payment record (reuse if PENDING already exists)
        if existing and existing["status"] == "PENDING":
            _execute(
                """
                UPDATE payments
                   SET order_id   = %s,
                       amount     = %s,
                       updated_at = NOW()
                 WHERE payment_id = %s
                """,
                [rz_order["id"], amount, str(existing["payment_id"])],
            )
        else:
            _execute(
                """
                INSERT INTO payments
                  (order_id, payment_for, reference_id, patient_id, amount, status)
                VALUES (%s, %s, %s, %s, %s, 'PENDING')
                """,
                [
                    rz_order["id"],
                    payment_for,
                    str(reference_id),
                    str(patient_id),
                    amount,
                ],
            )

        return {
            "order_id": rz_order["id"],
            "amount": int(amount * 100),
            "currency": "INR",
            "key_id": settings.RAZORPAY_KEY_ID,
            "payment_for": payment_for,
            "reference_id": str(reference_id),
        }

    # ── Verify Payment ─────────────────────────────────────────────────────────

    @staticmethod
    def verify_payment(validated_data, patient_id):
        order_id = validated_data["razorpay_order_id"]
        payment_id = validated_data["razorpay_payment_id"]
        signature = validated_data["razorpay_signature"]

        # Verify HMAC-SHA256 signature
        body = f"{order_id}|{payment_id}".encode()  # encode to bytes
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            _execute(
                """
                UPDATE payments
                   SET status = 'FAILED',
                       failure_reason = 'Signature mismatch',
                       updated_at = NOW()
                 WHERE order_id = %s
                """,
                [order_id],
            )
            raise ValidationException("Payment verification failed. Invalid signature.")

        payment = _execute(
            "SELECT * FROM payments WHERE order_id = %s",
            [order_id],
            fetch="one",
        )
        if not payment:
            raise NotFoundException("Payment record not found.")

        if str(payment["patient_id"]) != str(patient_id):
            raise PermissionException("You do not own this payment.")

        if payment["status"] == "SUCCESS":
            raise ValidationException("This payment has already been verified.")

        # Mark payment SUCCESS
        _execute(
            """
            UPDATE payments
               SET status = 'SUCCESS',
                   transaction_id = %s,
                   razorpay_signature = %s,
                   updated_at = NOW()
             WHERE order_id = %s
            """,
            [payment_id, signature, order_id],
        )

        # Confirm the booking in respective table
        if payment["payment_for"] == "APPOINTMENT":
            _execute(
                """
                UPDATE doctor_appointments
                   SET status = 'CONFIRMED', updated_at = NOW()
                 WHERE appointment_id = %s
                """,
                [payment["reference_id"]],
            )
        else:
            _execute(
                """
                UPDATE lab_test_slot_bookings
                   SET booking_status = 'CONFIRMED', updated_at = NOW()
                 WHERE booking_id = %s
                """,
                [payment["reference_id"]],
            )

        return {
            "payment_id": payment_id,
            "payment_for": payment["payment_for"],
            "reference_id": payment["reference_id"],
            "amount": float(payment["amount"]),
        }

    # ── Refund ─────────────────────────────────────────────────────────────────

    @staticmethod
    def refund_payment(validated_data, patient_id):
        reference_id = validated_data["reference_id"]
        payment_for = validated_data["payment_for"]

        payment = _execute(
            """
            SELECT * FROM payments
             WHERE reference_id = %s
               AND payment_for  = %s
               AND patient_id   = %s
               AND status       = 'SUCCESS'
            """,
            [str(reference_id), payment_for, str(patient_id)],
            fetch="one",
        )
        if not payment:
            raise NotFoundException(
                "No successful payment found for this booking, or it does not belong to you."
            )

        client = _get_razorpay_client()
        refund = client.payment.refund(
            payment["transaction_id"],
            {
                "amount": int(float(payment["amount"]) * 100),
                "speed": "optimum",
            },
        )

        _execute(
            """
            UPDATE payments
               SET status = 'REFUNDED',
                   refund_id = %s,
                   updated_at = NOW()
             WHERE payment_id = %s
            """,
            [refund["id"], str(payment["payment_id"])],
        )

        # Cancel the associated booking
        if payment_for == "APPOINTMENT":
            _execute(
                """
                UPDATE doctor_appointments
                   SET status = 'CANCELLED', updated_at = NOW()
                 WHERE appointment_id = %s
                """,
                [reference_id],
            )
        else:
            _execute(
                """
                UPDATE lab_test_slot_bookings
                   SET booking_status = 'CANCELLED', updated_at = NOW()
                 WHERE booking_id = %s
                """,
                [reference_id],
            )

        return {
            "refund_id": refund["id"],
            "payment_for": payment_for,
            "reference_id": str(reference_id),
            "refunded_amount": float(payment["amount"]),
        }

    # ── History ────────────────────────────────────────────────────────────────

    @staticmethod
    def get_payment_history(patient_id, filters):
        conditions = ["patient_id = %s"]
        params = [str(patient_id)]

        if filters.get("payment_for"):
            conditions.append("payment_for = %s")
            params.append(filters["payment_for"])

        if filters.get("status"):
            conditions.append("status = %s")
            params.append(filters["status"])

        where = " AND ".join(conditions)
        params += [filters["limit"], filters["offset"]]

        rows = _execute(
            f"""
            SELECT payment_id, order_id, transaction_id,
                   payment_for, reference_id, amount, currency,
                   status, failure_reason, refund_id, created_at
              FROM payments
             WHERE {where}
             ORDER BY created_at DESC
             LIMIT %s OFFSET %s
            """,
            params,
            fetch="all",
        )

        total = _execute(
            f"SELECT COUNT(*) AS cnt FROM payments WHERE {where}",
            params[:-2],  # exclude LIMIT/OFFSET
            fetch="one",
        )

        return {
            "results": rows or [],
            "total": total["cnt"] if total else 0,
            "limit": filters["limit"],
            "offset": filters["offset"],
        }
