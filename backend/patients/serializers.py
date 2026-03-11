"""
Patient serializers — pure DRF Serializer (no ModelSerializer).
Validation and response shaping only.
DB writes are handled directly in views via DB functions.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from datetime import date
import db.user_queries as uq
import db.patient_queries as pq


# ------------------------------------------------------------
# Output sub-serializers (response shaping)
# ------------------------------------------------------------


class _UserOut(serializers.Serializer):
    user_id = serializers.UUIDField()
    email = serializers.EmailField()
    email_verified = serializers.BooleanField()
    role = serializers.CharField()
    is_active = serializers.BooleanField(source="user_is_active")
    two_factor_enabled = serializers.BooleanField()
    created_at = serializers.DateTimeField(source="user_created_at")
    updated_at = serializers.DateTimeField(source="user_updated_at")
    last_login_at = serializers.DateTimeField(allow_null=True)


class _GenderOut(serializers.Serializer):
    gender_id = serializers.IntegerField()
    gender_value = serializers.CharField()


class _BloodGroupOut(serializers.Serializer):
    blood_group_id = serializers.IntegerField()
    blood_group_value = serializers.CharField()


class _AddressOut(serializers.Serializer):
    address_id = serializers.IntegerField()
    address_line = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    pincode = serializers.CharField()


# ------------------------------------------------------------
# Patient profile response serializer
# ------------------------------------------------------------


class PatientProfileSerializer(serializers.Serializer):
    patient_id = serializers.UUIDField()
    user = serializers.SerializerMethodField()
    full_name = serializers.CharField()
    date_of_birth = serializers.DateField(allow_null=True)
    mobile = serializers.CharField()
    emergency_contact_name = serializers.CharField(allow_null=True)
    emergency_contact_phone = serializers.CharField(allow_null=True)
    profile_image = serializers.CharField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    # removed raw gender/blood_group integer fields — redundant alongside detail fields
    gender = serializers.SerializerMethodField()
    blood_group = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()

    def _src(self, obj):
        return obj if isinstance(obj, dict) else vars(obj)

    def get_user(self, obj):
        return _UserOut(self._src(obj)).data

    def get_gender(self, obj):
        d = self._src(obj)
        if not d.get("gender_id"):
            return None
        # using _GenderOut instead of inline dict
        return _GenderOut(
            {
                "gender_id": d["gender_id"],
                "gender_value": d.get("gender_value"),
            }
        ).data

    def get_blood_group(self, obj):
        d = self._src(obj)
        if not d.get("blood_group_id"):
            return None
        # using _BloodGroupOut instead of inline dict
        return _BloodGroupOut(
            {
                "blood_group_id": d["blood_group_id"],
                "blood_group_value": d.get("blood_group_value"),
            }
        ).data

    def get_address(self, obj):
        d = self._src(obj)
        if not d.get("address_id"):
            return None
        # removed latitude/longitude — not in DB schema
        return _AddressOut(
            {
                "address_id": d["address_id"],
                "address_line": d.get("address_line", ""),
                "city": d.get("city", ""),
                "state": d.get("state", ""),
                "pincode": d.get("pincode", ""),
            }
        ).data



class PatientListSerializer(serializers.Serializer):
    patient_id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    mobile = serializers.CharField()
    blood_group = serializers.CharField()
    gender = serializers.CharField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()



# ------------------------------------------------------------
# Patient registration serializer (validation only)
# ------------------------------------------------------------


class PatientRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    oauth_provider = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    oauth_provider_id = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    full_name = serializers.CharField(required=True, max_length=255)
    mobile = serializers.CharField(required=True, max_length=15)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender_id = serializers.IntegerField(required=True)
    blood_group_id = serializers.IntegerField(required=False, allow_null=True)
    address_line = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    city = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=100
    )
    state = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=100
    )
    pincode = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=10
    )
    emergency_contact_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=255,  # fixed: was 100, DB is VARCHAR(255)
    )
    emergency_contact_phone = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=15
    )

    # def validate_email(self, value):
    #     if uq.email_exists(value):
    #         raise serializers.ValidationError("A user with this email already exists.")
    #     return value

    # def validate_gender_id(self, value):
    #     if not uq.gender_exists(value):
    #         raise serializers.ValidationError("Invalid gender ID.")
    #     return value

    # def validate_blood_group_id(self, value):
    #     if value and not uq.blood_group_exists(value):
    #         raise serializers.ValidationError("Invalid blood group ID.")
    #     return value

    def validate_date_of_birth(self, value):
        # future date of birth is not valid
        if value and value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def validate(self, attrs):
        # password_confirm popped here so it never reaches the view
        password_confirm = attrs.pop("password_confirm", None)
        if attrs["password"] != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs


# ------------------------------------------------------------
# Patient profile update serializer (validation only)
# ------------------------------------------------------------


class PatientProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, max_length=255)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender_id = serializers.IntegerField(required=False, allow_null=True)
    blood_group_id = serializers.IntegerField(required=False, allow_null=True)
    mobile = serializers.CharField(required=False, max_length=15)
    emergency_contact_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=255,  # fixed: DB is VARCHAR(255)
    )
    emergency_contact_phone = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=15
    )
    address_line = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,  # flattened — removed _AddressWriteSerializer
    )
    city = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=100
    )
    state = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=100
    )
    pincode = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=10
    )
    profile_image = serializers.CharField(
        required=False
    )  # removed allow_blank — DB col is NOT NULL

    def validate_mobile(self, value):
        patient_id = self.context.get("patient_id")
        if pq.mobile_exists(value, exclude_patient_id=patient_id):
            raise serializers.ValidationError(
                "A patient with this mobile number already exists."
            )
        return value

    def validate_gender_id(self, value):
        # added — was missing in update, present in registration
        if value and not uq.gender_exists(value):
            raise serializers.ValidationError("Invalid gender ID.")
        return value

    def validate_blood_group_id(self, value):
        # added — was missing in update, present in registration
        if value and not uq.blood_group_exists(value):
            raise serializers.ValidationError("Invalid blood group ID.")
        return value

    def validate_date_of_birth(self, value):
        # added — future date of birth is not valid
        if value and value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value
