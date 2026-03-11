from .email_service import EmailService
from db.connection import fn_fetchone
import db.lab_queries as lq


class RegistrationService:

    @staticmethod
    def _post_register(user_dict: dict, profile_type, request=None):
        email_sent = EmailService.send_verification_email(user_dict)
        if not email_sent:
            print("Failed to send verification email to %s", user_dict.get("email"))

        return user_dict, email_sent

    # -------------------------------------------------------------------------

    @staticmethod
    def register_patient(data: dict, request=None, image_path: str = None):
        from users.services.password_service import hash_password

        hashed_password = hash_password(data["password"])
        profile_image = image_path or "/media/defaults/patient.png"
        address_line = data.get("address_line") or ""
        city = data.get("city") or ""
        state = data.get("state") or ""
        pincode = data.get("pincode") or ""

        res = fn_fetchone("o_insert_address", [address_line, city, state, pincode])
        address_id = list(res.values())[0]

        user_dict = fn_fetchone(
            "register_patient_user",
            [
                data["email"],
                data["full_name"],
                data.get("date_of_birth"),
                data["mobile"],
                data.get("emergency_contact_name") or "",
                data.get("emergency_contact_phone") or "",
                profile_image,
                address_id,
                data.get("blood_group_id"),
                data["gender_id"],
                hashed_password,
            ],
        )
        print(f"Response After Register Patient : {user_dict}")
        # Response After Register Patient : {'user_id': UUID('90ef8108-1770-48f1-b887-b4ef74df5394'),
        # 'email': 'yiyih70694@7novels.com', 'is_active': True, 'email_verified': False}

        return RegistrationService._post_register(user_dict, "patient", request=request)

    # -------------------------------------------------------------------------

    @staticmethod
    def register_doctor(data: dict, request=None, image_path: str = None):
        from users.services.password_service import hash_password

        print(f"\n\nDoctor : {data}\n\n")

        hashed_password = hash_password(data["password"])
        profile_image = image_path or "/media/defaults/doctor.png"
        address_line = data.get("address_line") or ""
        city = data.get("city") or ""
        state = data.get("state") or ""
        pincode = data.get("pincode") or ""

        res = fn_fetchone("o_insert_address", [address_line, city, state, pincode])
        address_id = list(res.values())[0]

        user_dict = fn_fetchone(
            "register_doctor_user",
            [
                data["email"],
                data["full_name"],
                data.get("experience_years"),
                data["phone_number"],
                data.get("consultation_fee") or 0,
                data["registration_number"],
                profile_image,
                address_id,
                data["gender_id"],
                hashed_password,
            ],
        )

        doctor_qualifications = data["qualifications"]
        print(f"doctor_qualifications : {doctor_qualifications}")
        for doctor_qualification in doctor_qualifications:
            res = fn_fetchone(
                "d_add_qualification",
                [
                    user_dict["user_id"],
                    doctor_qualification["qualification_id"],
                    doctor_qualification["institution"],
                    doctor_qualification["year_of_completion"],
                ],
            )
            print(f"Qualification Add id : {res}")

        return RegistrationService._post_register(user_dict, "doctor", request=request)

    # -------------------------------------------------------------------------

    @staticmethod
    def register_lab(data: dict, request=None, image_path: str = None):
        """
        BUG FIX: old code called serializer.save() which doesn't exist on plain
        DRF Serializer. Rewritten to mirror register_patient/register_doctor pattern.
        """
        try:
            from users.services.password_service import hash_password

            hashed_password = hash_password(data["password"])
            lab_logo = image_path or data.get("lab_logo") or "/media/defaults/lab.png"
            address_line = data.get("address_line") or ""
            city = data.get("city") or ""
            state = data.get("state") or ""
            pincode = data.get("pincode") or ""

            res = fn_fetchone("o_insert_address", [address_line, city, state, pincode])
            address_id = list(res.values())[0]

            res = fn_fetchone(
                "register_lab_user",
                [
                    data["email"],
                    data["lab_name"],
                    data.get("license_number"),
                    data.get("phone_number"),
                    lab_logo,
                    address_id,
                    hashed_password,
                ],
            )
            user_id = list(res.values())[0]

            user_dict = {"user_id": user_id, "email": data["email"]}

            # Fetch full lab profile and attach operating hours / services
            lab_dict = lq.get_lab_by_user_id(user_id) or {}
            lab_dict["operating_hours"] = []
            lab_dict["services"] = []

            # Persist optional operating hours
            for oh in data.get("operating_hours", []):
                lq.insert_lab_operating_hour(
                    user_id,
                    oh["day_of_week"],
                    oh.get("open_time"),
                    oh.get("close_time"),
                    oh.get("is_closed", False),
                )
            if data.get("operating_hours"):
                lab_dict["operating_hours"] = lq.get_lab_operating_hours(user_id)

            # Persist optional services
            for svc in data.get("services", []):
                lq.insert_lab_service(
                    user_id,
                    svc["service_name"],
                    svc.get("description"),
                    svc.get("price"),
                    svc.get("turnaround_hours"),
                )
            if data.get("services"):
                lab_dict["services"] = lq.get_lab_services(user_id)

            return RegistrationService._post_register(
                user_dict, lab_dict, "lab", request=request
            )
        except Exception as e:
            print(e)
            raise
