from django.core.management.base import BaseCommand
from db.connection import fn_scalar, fetchscalar


class Command(BaseCommand):
    help = "Populate Gender, BloodGroup, Qualification, UserRoles and VerificationTypes tables"

    def handle(self, *args, **options):
        self.stdout.write("Populating database...")

        roles = [
            ("admin",          "System administrator"),
            ("staff",          "Staff member"),
            ("doctor",         "Medical doctor"),
            ("patient",        "Patient user"),
            ("lab_technician", "Lab technician"),
        ]
        for role, desc in roles:
            fn_scalar("o_insert_user_role", [role, desc])
            self.stdout.write(f"  Role: {role}")

        vtypes = [
            ("email_verification", "Token used to verify user email address"),
            ("password_reset",     "Token used to reset user password"),
        ]
        for name, desc in vtypes:
            fn_scalar("o_insert_verification_type", [name, desc])
            self.stdout.write(f"  Verification type: {name}")

        for g in ["Male", "Female", "Other"]:
            fn_scalar("o_insert_gender", [g])
            self.stdout.write(f"  Gender: {g}")

        for bg in ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]:
            fn_scalar("o_insert_blood_group", [bg])
            self.stdout.write(f"  Blood group: {bg}")

        qualifications = [
            ("MBBS", "Bachelor of Medicine, Bachelor of Surgery"),
            ("MD",   "Doctor of Medicine"),
            ("MS",   "Master of Surgery"),
            ("BDS",  "Bachelor of Dental Surgery"),
            ("MDS",  "Master of Dental Surgery"),
            ("BAMS", "Bachelor of Ayurvedic Medicine and Surgery"),
            ("BHMS", "Bachelor of Homeopathic Medicine and Surgery"),
            ("BUMS", "Bachelor of Unani Medicine and Surgery"),
            ("DM",   "Doctorate of Medicine"),
            ("MCh",  "Master of Chirurgiae"),
        ]
        for code, name in qualifications:
            fn_scalar("o_insert_qualification", [code, name])
            self.stdout.write(f"  Qualification: {code}")

        self.stdout.write(self.style.SUCCESS("\nDatabase populated successfully!"))