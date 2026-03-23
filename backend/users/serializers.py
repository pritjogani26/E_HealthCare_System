# backend\users\serializers.py
from rest_framework import serializers


class GenderSerializer(serializers.Serializer):
    gender_id = serializers.IntegerField()
    gender_value = serializers.CharField()
    created_at = serializers.DateTimeField()


class BloodGroupSerializer(serializers.Serializer):
    blood_group_id = serializers.IntegerField()
    blood_group_value = serializers.CharField()
    created_at = serializers.DateTimeField()


class QualificationSerializer(serializers.Serializer):
    qualification_id = serializers.IntegerField()
    qualification_code = serializers.CharField()
    qualification_name = serializers.CharField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class SpecializationSerializer(serializers.Serializer):
    specialization_id = serializers.IntegerField()
    specialization_name = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class AddressSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(read_only=True)
    address_line = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    pincode = serializers.CharField()

class UserSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    email = serializers.EmailField()
    email_verified = serializers.BooleanField()
    role = serializers.CharField()
    is_active = serializers.BooleanField()
    two_factor_enabled = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    last_login_at = serializers.DateTimeField(allow_null=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

class LogoutSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_null=True)


 
class ReAuthVerifySerializer(serializers.Serializer): 
    password = serializers.CharField(
        max_length=256,
        min_length=1,
        write_only=True,
        trim_whitespace=False,
        error_messages={
            "blank": "Password may not be blank.",
            "max_length": "Password is too long.",
        },
    )


class AuditLogsDownload(serializers.Serializer):
    status = serializers.CharField()
    type = serializers.CharField()