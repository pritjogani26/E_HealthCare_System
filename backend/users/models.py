# backend\users\models.py
import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.utils import timezone


class AccountStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    SUSPENDED = "SUSPENDED", "Suspended"
    DELETED = "DELETED", "Deleted"


class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    STAFF = "STAFF", "Staff"
    DOCTOR = "DOCTOR", "Doctor"
    PATIENT = "PATIENT", "Patient"
    LAB = "LAB", "Lab"


class VerificationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Verification"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"
    ACTIVE = "ACTIVE", "Active"


class GenderChoice(models.TextChoices):
    MALE = "M", "Male"
    FEMALE = "F", "Female"
    OTHER = "O", "Other"


class DocumentType(models.TextChoices):
    DEGREE = "DEGREE", "Degree Certificate"
    LICENSE = "LICENSE", "Medical License"
    REGISTRATION = "REGISTRATION", "Registration Certificate"
    EXPERIENCE = "EXPERIENCE", "Experience Certificate"
    LAB_LICENSE = "LAB_LICENSE", "Lab License"
    LAB_ACCREDITATION = "LAB_ACCREDITATION", "Lab Accreditation"




class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)

    role = models.CharField(
        max_length=20, choices=UserRole.choices, default=UserRole.PATIENT
    )
    account_status = models.CharField(
        max_length=20, choices=AccountStatus.choices, default=AccountStatus.ACTIVE
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    oauth_provider = models.CharField(max_length=100, null=True, blank=True)
    oauth_provider_id = models.CharField(max_length=255, null=True, blank=True)
    login_pin = models.CharField(max_length=255, null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)

    failed_login_attempts = models.IntegerField(default=0)
    lockout_until = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        # Use "users" to match the SQL you shared earlier. If your table is named "user", change it back.
        db_table = "users"

    def __str__(self):
        return self.email


class EmailVerificationTable(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_verify"
    )
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "email_verification_table"
        indexes = [
            models.Index(fields=["token"]),
            models.Index(fields=["user", "is_used"]),
        ]

    def __str__(self):
        return f"EmailVerification({self.user.email}, {self.token})"


class Gender(models.Model):
    gender_id = models.AutoField(primary_key=True)
    gender_value = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "genders"

    def __str__(self):
        return self.gender_value


class BloodGroup(models.Model):
    blood_group_id = models.AutoField(primary_key=True)
    blood_group_value = models.CharField(max_length=5, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "blood_groups"

    def __str__(self):
        return self.blood_group_value


class Qualification(models.Model):
    qualification_id = models.AutoField(primary_key=True)
    qualification_code = models.CharField(max_length=10, unique=True)
    qualification_name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "qualifications"

    def __str__(self):
        return f"{self.qualification_code} - {self.qualification_name}"


class Patient(models.Model):
    patient_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_profile",
    )

    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.ForeignKey(Gender, on_delete=models.SET_NULL, null=True)
    blood_group = models.ForeignKey(
        BloodGroup, on_delete=models.SET_NULL, null=True, blank=True
    )

    mobile = models.CharField(max_length=15, unique=True)
    emergency_contact_name = models.CharField(max_length=255, null=True, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, null=True, blank=True)

    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    pincode = models.CharField(max_length=10, null=True, blank=True)

    profile_image = models.CharField(
        max_length=255, default="/media/defaults/patient.png"
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "patients"

    def __str__(self):
        return f"{self.full_name} ({getattr(self.user, 'email', '')})"



class Doctor(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="doctor_profile",
    )

    full_name = models.CharField(max_length=255)
    gender = models.ForeignKey(Gender, on_delete=models.SET_NULL, null=True)
    experience_years = models.DecimalField(
        max_digits=6, decimal_places=2, default=Decimal("0.00")
    )

    phone_number = models.CharField(max_length=15, unique=True)
    consultation_fee = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    registration_number = models.CharField(max_length=100, unique=True)

    profile_image = models.CharField(
        max_length=255, default="/media/defaults/doctor.png"
    )
    joining_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="doctors_verified",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "doctors"

    def __str__(self):
        return f"Dr. {self.full_name} ({getattr(self.user, 'email', '')})"


class DoctorQualification(models.Model):
    doctor_qualification_id = models.AutoField(primary_key=True)
    doctor = models.ForeignKey(
        Doctor, on_delete=models.CASCADE, related_name="qualifications"
    )
    qualification = models.ForeignKey(Qualification, on_delete=models.CASCADE)

    institution = models.CharField(max_length=255, null=True, blank=True)
    year_of_completion = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "doctor_qualifications"
        unique_together = ("doctor", "qualification")

    def __str__(self):
        return f"{self.doctor.full_name} - {self.qualification.qualification_code}"


class Lab(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="lab_profile",
    )

    lab_name = models.CharField(max_length=255)
    license_number = models.CharField(
        max_length=100, unique=True, null=True, blank=True
    )

    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)

    phone_number = models.CharField(max_length=15, null=True, blank=True)
    lab_logo = models.CharField(max_length=255, default="/media/defaults/lab.png")

    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="labs_verified",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(null=True, blank=True)

    operating_hours = models.JSONField(
        null=True, blank=True, help_text="{'monday':'9AM-6PM', ...}"
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "labs"

    def __str__(self):
        return f"{self.lab_name} ({getattr(self.user, 'email', '')})"




class EmailVerificationTable(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_column="user_id",
        on_delete=models.CASCADE,
        related_name="email_verify",
    )
    token = models.TextField(unique=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "email_verification_table"

    def __str__(self):
        return f"{self.id} - {self.token[:8]}..."


class UserTokens(models.Model):
    token_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_column="user_id",
        on_delete=models.CASCADE,
        related_name="tokens",
    )
    refresh_token = models.TextField(unique=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_revoked = models.BooleanField(default=False)

    class Meta:
        db_table = "user_tokens"

    def __str__(self):
        return f"token {self.token_id} for user {getattr(self.user, 'email', '')}"
