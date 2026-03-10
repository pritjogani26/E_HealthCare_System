import db.patient_queries as pq
import db.user_queries as uq
from patients.serializers import PatientProfileSerializer
from users.AuditLog import AuditLogger, build_changes_dict
from users.services.base_profile_service import BaseProfileService


class ProfileService(BaseProfileService):

    @staticmethod
    def get_patient_profile(user) -> dict | None:
        user_id = str(getattr(user, "user_id", ""))
        return pq.get_patient_by_user_id(user_id)

    @staticmethod
    def update_patient_profile(patient_dict: dict, serializer, request=None) -> dict:
        """
        Apply validated_data to the patient profile using DB query functions directly.
        DRF plain Serializer has no .update() — handled here.
        """
        patient_id = str(patient_dict.get("patient_id") or patient_dict.get("user_id"))
        data = serializer.validated_data
        changes = build_changes_dict(patient_dict, data)

        # ---- Address -------------------------------------------------------
        address_id = patient_dict.get("address_id")
        address_fields = {k: data.get(k) for k in ("address_line", "city", "state", "pincode")}
        if any(v is not None for v in address_fields.values()):
            if address_id:
                uq.update_address(address_id, **{k: v for k, v in address_fields.items() if v is not None})
            else:
                address_id = uq.create_address(
                    address_line=address_fields.get("address_line", ""),
                    city=address_fields.get("city", ""),
                    state=address_fields.get("state", ""),
                    pincode=address_fields.get("pincode", ""),
                )

        # ---- Core profile --------------------------------------------------
        profile_fields = {
            k: data[k]
            for k in (
                "full_name", "date_of_birth", "mobile",
                "emergency_contact_name", "emergency_contact_phone",
                "profile_image", "gender_id", "blood_group_id",
            )
            if k in data
        }
        if address_id and address_id != patient_dict.get("address_id"):
            profile_fields["address_id"] = address_id

        updated = pq.update_patient(patient_id, **profile_fields)

        if changes:
            AuditLogger.patient_profile_updated(updated, changes=changes, request=request)

        return PatientProfileSerializer(updated).data