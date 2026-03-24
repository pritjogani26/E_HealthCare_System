import db.patient_queries as pq
import db.user_queries as uq
from patients.serializers import PatientProfileSerializer
from users.services.base_profile_service import BaseProfileService


class ProfileService(BaseProfileService):

    @staticmethod
    def get_patient_profile(user) -> dict | None:
        user_id = str(getattr(user, "user_id", ""))
        return pq.get_patient_by_id(user_id)

    @staticmethod
    def update_patient_profile(patient_dict: dict, serializer, request=None) -> dict:
        print("\n\nInside update_patient_profile.")
        patient_id = str(patient_dict.get("patient_id") or patient_dict.get("user_id"))
        data = serializer.validated_data
        print(f"\nPatient data : {data}")
        addr = data.get("address") or {}
        address_fields = {
            k: addr.get(k) if k in addr else data.get(k)
            for k in ("address_line", "city", "state", "pincode")
        }
        print(f"\n\nAddress Fields : {address_fields}")

        if any(v is not None for v in address_fields.values()):
            if patient_dict.get("address_line"):
                print("\nYes Address is available. Updating.")
                uq.update_address_by_user_id(
                    patient_id,
                    **{k: v for k, v in address_fields.items() if v is not None},
                )
                print("\nUpdate Successful.")
            else:
                print("\nCreating new address.")
                uq.create_address(
                    user_id=patient_id,
                    address_line=address_fields.get("address_line", ""),
                    city=address_fields.get("city", ""),
                    state=address_fields.get("state", ""),
                    pincode=address_fields.get("pincode", ""),
                )

        profile_fields = {
            k: data[k]
            for k in (
                "full_name",
                "date_of_birth",
                "mobile",
                "emergency_contact_name",
                "emergency_contact_phone",
                "profile_image",
                "gender_id",
                "blood_group_id",
            )
            if k in data
        }
        # Removed profile_fields["address_id"] = address_id
        updated = pq.update_patient(patient_id, **profile_fields)
        return PatientProfileSerializer(updated).data
