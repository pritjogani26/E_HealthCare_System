
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from datetime import date
import db.user_queries as uq
import db.patient_queries as pq


class _UserOut(serializers.Serializer):
    patient_id = serializers.UUIDField()
    email = serializers.EmailField()
    email_verified = serializers.BooleanField()
    role = serializers.CharField()
    is_active = serializers.BooleanField()
    two_factor_enabled = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    last_login_at = serializers.DateTimeField(allow_null=True)


class _GenderOut(serializers.Serializer):
    gender_id = serializers.IntegerField()
    gender_value = serializers.CharField()


class _BloodGroupOut(serializers.Serializer):
    blood_group_id = serializers.IntegerField()
    blood_group_value = serializers.CharField()


class _AddressOut(serializers.Serializer):
    address_line = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    pincode = serializers.CharField()


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

    gender = serializers.SerializerMethodField()
    blood_group = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()

    def _src(self, obj):
        return obj if isinstance(obj, dict) else vars(obj)

    def get_user(self, obj):
        # print(f"\n\nUser : {obj}")
        # return _UserOut(self._src(obj)).data
        return obj

    def get_gender(self, obj):
        d = self._src(obj)
        if not d.get("gender_id"):
            return None
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
        return _BloodGroupOut(
            {
                "blood_group_id": d["blood_group_id"],
                "blood_group_value": d.get("blood_group_value"),
            }
        ).data

    def get_address(self, obj):
        d = self._src(obj)
        if not d.get("address_line"):
            return None
        return _AddressOut(
            {
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
        max_length=255,
    )
    emergency_contact_phone = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=15
    )

    def validate_date_of_birth(self, value):
        if value and value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def validate(self, attrs):
        password_confirm = attrs.pop("password_confirm", None)
        if attrs["password"] != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs


class PatientProfileUpdateSerializer(serializers.Serializer):
    patient_id = serializers.UUIDField()
    full_name = serializers.CharField(required=False, max_length=255)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    mobile = serializers.CharField(required=False, max_length=15)
    gender_id = serializers.IntegerField(required=False, allow_null=True)
    blood_group = serializers.CharField(required=False, allow_null=True)
    emergency_contact_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=255,
    )
    emergency_contact_phone = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=15
    )
    address_line = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
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
    address = serializers.JSONField(required=False, allow_null=True)
