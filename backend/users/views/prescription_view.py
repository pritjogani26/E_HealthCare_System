# backend/users/views/prescription_view.py
#
# URL wiring (add to users/urls.py):
#
#   path("appointments/<int:appointment_id>/prescribe/",
#        PrescribeAppointmentView.as_view()),
#
#   path("appointments/<int:appointment_id>/prescription/",
#        AppointmentPrescriptionView.as_view()),
#
#   path("prescriptions/my/",
#        MyPrescriptionsView.as_view()),

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.middleware.exceptions import (
    NotFoundException,
    PermissionException,
    ValidationException,
)
from users.models import UserRole
from users.services.success_response import send_success_msg
import users.database_queries.doctor_queries as dq
import users.database_queries.prescription_queries as pq
from users.services.prescription_service import (
    generate_prescription_number,
    generate_prescription_pdf,
)
from users.serializers.prescription_serializers import (
    PrescriptionCreateSerializer,
    PrescriptionOutputSerializer,
    PatientPrescriptionListSerializer,
)


class PrescribeAppointmentView(generics.GenericAPIView):
    """
    POST /appointments/<appointment_id>/prescribe/
    Doctor submits prescription → PDF generated → appointment marked completed.
    """

    permission_classes = [IsAuthenticated]
    serializer_class   = PrescriptionCreateSerializer

    def post(self, request, appointment_id: int):
        # ── auth guard ────────────────────────────────────────
        if getattr(request.user, "role", None) != UserRole.DOCTOR:
            raise PermissionException("Only doctors can prescribe.")

        doctor_user_id = str(request.user.user_id)

        # ── fetch appointment ─────────────────────────────────
        appointment = dq.get_appointment_by_id(appointment_id)
        if not appointment:
            raise NotFoundException("Appointment not found.")
        if str(appointment["doctor_id"]) != doctor_user_id:
            raise PermissionException("This appointment does not belong to you.")
        if appointment["status"] == "completed":
            raise ValidationException("Appointment already completed.")
        if appointment["status"] == "cancelled":
            raise ValidationException("Cannot prescribe for a cancelled appointment.")

        # ── validate input ────────────────────────────────────
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # ── fetch doctor & patient profiles for PDF ───────────
        doctor  = dq.get_full_doctor_profile(doctor_user_id)
        patient = _get_patient_profile(str(appointment["patient_id"]))

        # ── persist prescription (no PDF path yet) ────────────
        presc_number = generate_prescription_number()
        prescription_id = pq.create_prescription(
            appointment_id  = appointment_id,
            doctor_id       = doctor_user_id,
            patient_id      = str(appointment["patient_id"]),
            prescription_number = presc_number,
            clinical_notes  = data.get("clinical_notes") or None,
            lab_tests       = data.get("lab_tests")      or None,
            advice          = data.get("advice")         or None,
            follow_up_date  = data.get("follow_up_date"),
        )

        # ── persist medicines ──────────────────────────────────
        medicines_input = data.get("medicines", [])
        for idx, med in enumerate(medicines_input):
            pq.add_prescription_medicine(
                prescription_id = prescription_id,
                medicine_name   = med["medicine_name"],
                dosage          = med.get("dosage")       or None,
                frequency       = med.get("frequency")    or None,
                duration        = med.get("duration")     or None,
                instructions    = med.get("instructions") or None,
                sort_order      = idx,
            )

        # ── generate PDF ──────────────────────────────────────
        medicines_saved = pq.get_prescription_medicines(prescription_id)
        prescription_row = {
            "prescription_id":     prescription_id,
            "prescription_number": presc_number,
            "clinical_notes":      data.get("clinical_notes"),
            "lab_tests":           data.get("lab_tests"),
            "advice":              data.get("advice"),
            "follow_up_date":      data.get("follow_up_date"),
        }

        try:
            _abs, rel_path = generate_prescription_pdf(
                prescription = prescription_row,
                doctor       = doctor,
                patient      = patient,
                medicines    = medicines_saved,
                appointment  = appointment,
            )
            pq.update_prescription_pdf(prescription_id, rel_path)
        except Exception as exc:
            # PDF failure is non-fatal — prescription is still saved
            rel_path = None
            print(f"[PrescriptionPDF] generation failed: {exc}")

        # ── build response ────────────────────────────────────
        full_prescription = pq.get_prescription_by_appointment(appointment_id)
        full_prescription["medicines"] = pq.get_prescription_medicines(prescription_id)

        out = PrescriptionOutputSerializer(
            full_prescription, context={"request": request}
        ).data

        return send_success_msg(
            out,
            message="Prescription created and appointment completed.",
            http_status=status.HTTP_201_CREATED,
        )


class AppointmentPrescriptionView(generics.GenericAPIView):
    """
    GET /appointments/<appointment_id>/prescription/
    Doctor or Patient can fetch the prescription for an appointment.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, appointment_id: int):
        role = getattr(request.user, "role", None)
        user_id = str(request.user.user_id)

        appointment = dq.get_appointment_by_id(appointment_id)
        if not appointment:
            raise NotFoundException("Appointment not found.")

        if role == UserRole.DOCTOR and str(appointment["doctor_id"]) != user_id:
            raise PermissionException("Access denied.")
        if role == UserRole.PATIENT and str(appointment["patient_id"]) != user_id:
            raise PermissionException("Access denied.")
        if role not in (UserRole.DOCTOR, UserRole.PATIENT):
            raise PermissionException("Access denied.")

        prescription = pq.get_prescription_by_appointment(appointment_id)
        if not prescription:
            raise NotFoundException("No prescription found for this appointment.")

        prescription["medicines"] = pq.get_prescription_medicines(
            str(prescription["prescription_id"])
        )

        out = PrescriptionOutputSerializer(
            prescription, context={"request": request}
        ).data
        return send_success_msg(out)


class MyPrescriptionsView(generics.GenericAPIView):
    """
    GET /prescriptions/my/
    Patient gets their full prescription history.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) != UserRole.PATIENT:
            raise PermissionException("Only patients can access this.")

        prescriptions = pq.get_patient_prescriptions(str(request.user.user_id))
        out = PatientPrescriptionListSerializer(
            prescriptions, many=True, context={"request": request}
        ).data
        return send_success_msg(out)


# ── helpers ───────────────────────────────────────────────────

def _get_patient_profile(patient_id: str) -> dict:
    """Fetch a minimal patient dict used only for PDF rendering."""
    from users.database_queries import patient_queries as patq
    try:
        return patq.get_full_patient_profile(patient_id) or {}
    except Exception:
        return {}