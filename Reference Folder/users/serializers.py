# Hospital_Management\backend\users\serializers.py
import re
from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(min_length=2, max_length=100)
    last_name = serializers.CharField(min_length=2, max_length=100)
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=15, required=False)
    password = serializers.CharField(min_length=5, write_only=True)
    role = serializers.ChoiceField(choices=[1, 2, 3, 4, 5])
    profile_image = serializers.ImageField(required=False, allow_null=True)

    def validate_mobile(self, value):
        if not re.match(r"^[6-9]\d{9}$", value):
            raise serializers.ValidationError("Invalid Mobile number.")
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=5, write_only=True)


class ProfileSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=15, required=False)
    role_ids = serializers.CharField()
    profile_image = serializers.CharField(required=False, allow_null=True)
    status = serializers.CharField()
    email_verified = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    last_login = serializers.DateTimeField()


class ProfileUpdateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    first_name = serializers.CharField(min_length=2, max_length=100)
    last_name = serializers.CharField(min_length=2, max_length=100)
    mobile = serializers.CharField(
        max_length=15,
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    profile_image = serializers.ImageField(required=False, allow_null=True)

    def validate_mobile(self, value):
        if value in (None, ""):
            return value
        if not re.match(r"^[6-9]\d{9}$", value):
            raise serializers.ValidationError("Invalid mobile number.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(min_length=5, write_only=True)
    new_password = serializers.CharField(min_length=5, write_only=True)
