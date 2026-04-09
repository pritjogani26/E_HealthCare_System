# backend\users\serializers\lab_booking_serializers.py
"""
Serializers for the lab test booking module.

Rules enforced here:
  - Field-level validation only (type coercion, allowed values, presence).
  - collection_address shape is validated when collection_type='home'.
  - No business logic (pricing, DB calls) — that lives in services.py.
"""

from rest_framework import serializers


# ─────────────────────────────────────────────────────────────────────────────
# Nested / reusable
# ─────────────────────────────────────────────────────────────────────────────

COLLECTION_TYPES = ("lab_visit", "home")
BOOKING_STATUSES = ("BOOKED", "COMPLETED", "CANCELLED")
REPORT_TYPES     = ("pdf", "image", "csv", "other")


class CollectionAddressSerializer(serializers.Serializer):
    """
    Shape of the JSONB collection_address column.

    Only required when collection_type='home'. All sub-fields are optional
    to keep future extensibility open, but `address_line1` and `city` are
    the expected minimum.
    """
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(
        max_length=255, allow_blank=True, allow_null=True, required=False
    )
    city          = serializers.CharField(max_length=100)
    state         = serializers.CharField(
        max_length=100, allow_blank=True, allow_null=True, required=False
    )
    pincode       = serializers.CharField(
        max_length=20, allow_blank=True, allow_null=True, required=False
    )
    landmark      = serializers.CharField(
        max_length=255, allow_blank=True, allow_null=True, required=False
    )


# ─────────────────────────────────────────────────────────────────────────────
# Request serializers  (input validation)
# ─────────────────────────────────────────────────────────────────────────────

class CreateBookingSerializer(serializers.Serializer):
    """
    Validates the patient's booking request.

    Inputs:
        lab_id           – UUID of the lab.
        slot_id          – integer PK of the desired slot.
        test_id          – integer PK of the desired lab test.
        collection_type  – 'lab_visit' or 'home'.
        collection_address – required JSONB when collection_type='home'.
        notes            – optional patient notes / special instructions.

    Outputs: validated_data dict passed to LabBookingService.create_booking().
    """
    lab_id             = serializers.UUIDField()
    slot_id            = serializers.IntegerField(min_value=1)
    test_id            = serializers.IntegerField(min_value=1)
    collection_type    = serializers.ChoiceField(choices=COLLECTION_TYPES)
    collection_address = CollectionAddressSerializer(required=False, allow_null=True)
    notes              = serializers.CharField(
        max_length=1000, allow_blank=True, allow_null=True, required=False
    )

    def validate(self, data):
        """
        Cross-field rule: collection_address is mandatory when collection_type='home'.
        """
        if data.get("collection_type") == "home":
            if not data.get("collection_address"):
                raise serializers.ValidationError(
                    {
                        "collection_address": (
                            "collection_address is required for home collection."
                        )
                    }
                )
        return data


class CancelBookingSerializer(serializers.Serializer):
    """
    Validates the patient's cancellation request.

    Inputs:
        cancellation_reason – optional free-text reason.
    """
    cancellation_reason = serializers.CharField(
        max_length=500, allow_blank=True, allow_null=True, required=False
    )


class CompleteBookingSerializer(serializers.Serializer):
    """
    Payload for marking a booking COMPLETED (sent by lab / admin).

    Currently no extra fields; kept as a serializer so future fields
    (e.g. technician_notes) can be added without changing the view.
    """
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Response serializers  (output shaping)
# ─────────────────────────────────────────────────────────────────────────────

class BookingDetailSerializer(serializers.Serializer):
    """
    Full booking detail returned after create, fetch, cancel, or complete.

    All fields are read-only because this serializer is only used for output.
    """
    booking_id             = serializers.UUIDField(read_only=True)
    patient_id             = serializers.UUIDField(read_only=True)
    lab_id                 = serializers.UUIDField(read_only=True)
    slot_id                = serializers.IntegerField(read_only=True)
    test_id                = serializers.IntegerField(read_only=True)
    collection_type        = serializers.CharField(read_only=True)
    collection_address     = serializers.JSONField(
        read_only=True, allow_null=True
    )
    booking_status         = serializers.CharField(read_only=True)

    # Pricing
    subtotal               = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    home_collection_charge = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    discount_amount        = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    total_amount           = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    # Patient notes
    notes                  = serializers.CharField(
        read_only=True, allow_null=True
    )

    # Cancellation info
    cancelled_at           = serializers.DateTimeField(
        read_only=True, allow_null=True
    )
    cancellation_reason    = serializers.CharField(
        read_only=True, allow_null=True
    )
    cancelled_by           = serializers.UUIDField(
        read_only=True, allow_null=True
    )

    # Timestamps
    created_at             = serializers.DateTimeField(read_only=True)
    updated_at             = serializers.DateTimeField(read_only=True)

    # Joined fields from lab_tests
    test_name              = serializers.CharField(read_only=True)
    test_code              = serializers.CharField(read_only=True)
    sample_type            = serializers.CharField(read_only=True)
    fasting_required       = serializers.BooleanField(read_only=True)

    # Joined fields from lab_test_slots
    slot_date              = serializers.DateField(read_only=True)
    start_time             = serializers.TimeField(read_only=True)
    end_time               = serializers.TimeField(read_only=True)

    # Joined field from labs
    lab_name               = serializers.CharField(read_only=True)


class LabReportSerializer(serializers.Serializer):
    """
    Represents a single report row from lab_test_reports.

    Used both for output and for validating upload requests.
    """
    result_id       = serializers.IntegerField(read_only=True)
    booking_id      = serializers.UUIDField(read_only=True)
    report_file_url = serializers.CharField(max_length=255)
    report_type     = serializers.ChoiceField(
        choices=REPORT_TYPES, default="pdf", required=False
    )
    result_notes    = serializers.CharField(
        max_length=5000, allow_blank=True, allow_null=True, required=False
    )
    uploaded_by     = serializers.UUIDField(read_only=True, allow_null=True)
    uploaded_at     = serializers.DateTimeField(read_only=True)


class LabSlotSerializer(serializers.Serializer):
    """
    Serializer for lab test slots.
    """
    slot_id      = serializers.IntegerField(read_only=True)
    lab_id       = serializers.UUIDField(read_only=True)
    slot_date    = serializers.DateField(read_only=True)
    start_time   = serializers.TimeField(read_only=True)
    end_time     = serializers.TimeField(read_only=True)
    booked_count = serializers.IntegerField(read_only=True)
    is_active    = serializers.BooleanField(read_only=True)
