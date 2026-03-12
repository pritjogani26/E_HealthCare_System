import db.lab_queries as lq
import db.user_queries as uq
from labs.serializers import LabProfileSerializer
from users.services.base_profile_service import BaseProfileService


class ProfileService(BaseProfileService):

    @staticmethod
    def get_lab_profile(user) -> dict | None:
        user_id = str(getattr(user, "user_id", ""))
        lab = lq.get_lab_by_user_id(user_id)
        if not lab:
            return None
        lab["operating_hours"] = lq.get_lab_operating_hours(user_id)
        lab["services"] = lq.get_lab_services(user_id)
        return lab

    @staticmethod
    def update_lab_profile(lab_dict: dict, serializer, request=None) -> dict:
        """
        Apply validated_data to the lab profile using DB query functions directly.
        DRF plain Serializer has no .update() — handled here.
        """
        user_id = str(lab_dict.get("lab_id") or lab_dict.get("lab_user_id"))
        data = serializer.validated_data

        # ---- Address -------------------------------------------------------
        address_id = lab_dict.get("address_id")
        address_fields = {
            k: data.get(k) for k in ("address_line", "city", "state", "pincode")
        }
        if any(v is not None for v in address_fields.values()):
            if address_id:
                uq.update_address(
                    address_id,
                    **{k: v for k, v in address_fields.items() if v is not None}
                )
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
            for k in ("lab_name", "license_number", "phone_number", "lab_logo")
            if k in data
        }
        if address_id and address_id != lab_dict.get("address_id"):
            profile_fields["address_id"] = address_id

        if profile_fields:
            lq.update_lab(user_id, **profile_fields)

        # ---- Operating hours (full replace) --------------------------------
        if "operating_hours" in data:
            lq.delete_lab_operating_hours(user_id)
            for oh in data["operating_hours"]:
                lq.insert_lab_operating_hour(
                    user_id,
                    oh["day_of_week"],
                    oh.get("open_time"),
                    oh.get("close_time"),
                    oh.get("is_closed", False),
                )

        # ---- Services (full replace) ---------------------------------------
        if "services" in data:
            lq.delete_lab_services(user_id)
            for svc in data["services"]:
                lq.insert_lab_service(
                    user_id,
                    svc["service_name"],
                    svc.get("description"),
                    svc.get("price"),
                    svc.get("turnaround_hours"),
                )

        # ---- Fetch updated profile -----------------------------------------
        updated = lq.get_lab_by_user_id(user_id)
        updated["operating_hours"] = lq.get_lab_operating_hours(user_id)
        updated["services"] = lq.get_lab_services(user_id)
        
        return LabProfileSerializer(updated).data
