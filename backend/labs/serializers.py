from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
import db.user_queries as uq
import db.lab_queries as lq


class _UserOut(serializers.Serializer):
    lab_id = serializers.UUIDField()
    email = serializers.EmailField()
    email_verified = serializers.BooleanField()
    role = serializers.CharField()
    is_active = serializers.BooleanField()
    two_factor_enabled = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    last_login_at = serializers.DateTimeField(allow_null=True)


class _AddressOut(serializers.Serializer):
    address_line = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    pincode = serializers.CharField()


class LabOperatingHourSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    open_time = serializers.TimeField()
    close_time = serializers.TimeField()
    is_closed = serializers.BooleanField(default=False)

    def validate(self, attrs):
        if not attrs.get("is_closed"):
            if not attrs.get("open_time") or not attrs.get("close_time"):
                raise serializers.ValidationError(
                    "open_time and close_time are required when is_closed is False."
                )
            if attrs["open_time"] >= attrs["close_time"]:
                raise serializers.ValidationError(
                    "open_time must be before close_time."
                )
        return attrs


class LabOperatingHourWriteSerializer(serializers.Serializer):
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    open_time = serializers.TimeField()
    close_time = serializers.TimeField()
    is_closed = serializers.BooleanField(default=False)

    def validate(self, attrs):
        if not attrs.get("is_closed"):
            if not attrs.get("open_time") or not attrs.get("close_time"):
                raise serializers.ValidationError(
                    "open_time and close_time are required when is_closed is False."
                )
            if attrs["open_time"] >= attrs["close_time"]:
                raise serializers.ValidationError(
                    "open_time must be before close_time."
                )
        return attrs


class LabServiceSerializer(serializers.Serializer):
    service_id = serializers.IntegerField(read_only=True)
    service_name = serializers.CharField(max_length=255)
    description = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, allow_null=True, required=False, min_value=0
    )
    turnaround_hours = serializers.IntegerField(
        allow_null=True, required=False, min_value=1
    )
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)


class LabProfileSerializer(serializers.Serializer):
    lab_id = serializers.UUIDField()
    lab_name = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField(allow_null=True)
    license_number = serializers.CharField(allow_null=True)
    lab_logo = serializers.CharField()
    verification_status = serializers.CharField()
    verified_at = serializers.DateTimeField(allow_null=True)
    verification_notes = serializers.CharField(allow_null=True, allow_blank=True)
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField(allow_null=True)

class LabListSerializer(serializers.Serializer):
    lab_id = serializers.UUIDField()
    email = serializers.EmailField()
    email_verified = serializers.BooleanField()
    is_active = serializers.BooleanField()
    last_login_at = serializers.DateTimeField(allow_null=True)
    role = serializers.CharField()
    lab_name = serializers.CharField()
    license_number = serializers.CharField(allow_null=True)
    phone_number = serializers.CharField(allow_null=True)
    lab_logo = serializers.CharField(allow_null=True, allow_blank=True)

    address_line = serializers.CharField(allow_null=True, allow_blank=True)
    city = serializers.CharField(allow_null=True, allow_blank=True)
    state = serializers.CharField(allow_null=True, allow_blank=True)
    pincode = serializers.CharField(allow_null=True, allow_blank=True)

    verification_status = serializers.CharField()
    verification_notes = serializers.CharField(allow_null=True, allow_blank=True)
    verified_at = serializers.DateTimeField(allow_null=True)
    verified_by_id = serializers.UUIDField(allow_null=True)
    verified_by_email = serializers.EmailField(allow_blank=True, allow_null=True)

    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField(allow_null=True)

class LabRegistrationSerializer(serializers.Serializer):
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
    lab_name = serializers.CharField(required=True, max_length=255)
    license_number = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=100
    )
    phone_number = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=15
    )
    address_line = serializers.CharField(required=True)
    city = serializers.CharField(required=True, max_length=100)
    state = serializers.CharField(required=True, max_length=100)
    pincode = serializers.CharField(required=True, max_length=10)
    services = LabServiceSerializer(many=True, required=False)
    operating_hours = LabOperatingHourWriteSerializer(many=True, required=False)

    def validate(self, attrs):
        password_confirm = attrs.pop("password_confirm", None)
        if attrs["password"] != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs


class LabProfileUpdateSerializer(serializers.Serializer):
    lab_name = serializers.CharField(required=False, max_length=255)
    license_number = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=100
    )
    phone_number = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=15
    )
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
    address = serializers.JSONField(required=False, allow_null=True)
    operating_hours = LabOperatingHourSerializer(many=True, required=False)
    services = LabServiceSerializer(many=True, required=False)
