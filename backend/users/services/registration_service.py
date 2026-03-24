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

    @staticmethod
    def register_address(data, user_id):
        address_line = data.get("address_line") or ""
        city = data.get("city") or ""
        state = data.get("state") or ""
        pincode = data.get("pincode") or ""

        res = fn_fetchone(
            "o_insert_address", [address_line, city, state, pincode, user_id]
        )
        address_id = list(res.values())[0]
        return address_id

    @staticmethod
    def register_patient(data: dict, request=None, image_path: str = None):
        from users.services.password_service import hash_password

        hashed_password = hash_password(data["password"])
        profile_image = image_path or "/media/defaults/patient.png"

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
                data.get("blood_group_id"),
                data["gender_id"],
                hashed_password,
            ],
        )

        address_id = RegistrationService.register_address(data, user_dict["user_id"])
        print(f"\nAddress Id : {address_id}")
        print(f"Response After Register Patient : {user_dict}")
        return RegistrationService._post_register(user_dict, "patient", request=request)

    @staticmethod
    def register_doctor(data: dict, request=None, image_path: str = None):
        from users.services.password_service import hash_password

        hashed_password = hash_password(data["password"])
        profile_image = image_path or "/media/defaults/doctor.png"
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
                data["gender_id"],
                hashed_password,
            ],
        )

        address_id = RegistrationService.register_address(data, user_dict["user_id"])
        print(f"\nAddress Id : {address_id}")

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

    @staticmethod
    def register_lab(data: dict, request=None, image_path: str = None):
        from users.services.password_service import hash_password

        hashed_password = hash_password(data["password"])
        lab_logo = image_path or data.get("lab_logo") or "/media/defaults/lab.png"

        res = fn_fetchone(
            "register_lab_user",
            [
                data["email"],
                data["lab_name"],
                data.get("license_number"),
                data.get("phone_number"),
                lab_logo,
                hashed_password,
            ],
        )
        lab_id = list(res.values())[0]

        address_id = RegistrationService.register_address(data, lab_id)
        print(f"Lab Added Successfully, ID : {lab_id}")
        print(f"Address Added Successfully, ID : {address_id}")

        for op in data.get("operating_hours"):
            res = fn_fetchone(
                "l_upsert_operating_hours",
                [
                    lab_id,
                    op.get("day_of_week"),
                    op.get("open_time"),
                    op.get("close_time"),
                    op.get("is_closed"),
                ],
            )
            print(res)

        user_dict = {"user_id": lab_id, "email": data["email"]}

        return RegistrationService._post_register(user_dict, "lab", request=request)
