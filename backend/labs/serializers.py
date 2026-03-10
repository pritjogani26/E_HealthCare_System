"""
Lab serializers — pure DRF Serializer (no ModelSerializer).
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
import db.user_queries as uq
import db.lab_queries as lq


# ---------------------------------------------------------------------------
# Output sub-serializers
# ---------------------------------------------------------------------------

class _UserOut(serializers.Serializer):
    user_id            = serializers.UUIDField(source="lab_id")
    email              = serializers.EmailField()
    email_verified     = serializers.BooleanField()
    role               = serializers.CharField()
    is_active          = serializers.BooleanField(source="user_is_active")
    two_factor_enabled = serializers.BooleanField()
    created_at         = serializers.DateTimeField(source="user_created_at")
    updated_at         = serializers.DateTimeField(source="user_updated_at")
    last_login_at      = serializers.DateTimeField(allow_null=True)


class _AddressOut(serializers.Serializer):
    address_id   = serializers.IntegerField()
    address_line = serializers.CharField()
    city         = serializers.CharField()
    state        = serializers.CharField()
    pincode      = serializers.CharField()


class LabOperatingHourSerializer(serializers.Serializer):
    id          = serializers.IntegerField(read_only=True)
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    open_time   = serializers.TimeField()
    close_time  = serializers.TimeField()
    is_closed   = serializers.BooleanField(default=False)

    def validate(self, attrs):
        if not attrs.get("is_closed"):
            if not attrs.get("open_time") or not attrs.get("close_time"):
                raise serializers.ValidationError(
                    "open_time and close_time are required when is_closed is False."
                )
            if attrs["open_time"] >= attrs["close_time"]:
                raise serializers.ValidationError("open_time must be before close_time.")
        return attrs


class LabServiceSerializer(serializers.Serializer):
    service_id       = serializers.IntegerField(read_only=True)
    service_name     = serializers.CharField(max_length=255)
    description      = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    price            = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, required=False, min_value=0)
    turnaround_hours = serializers.IntegerField(allow_null=True, required=False, min_value=1)
    is_active        = serializers.BooleanField(default=True)
    created_at       = serializers.DateTimeField(read_only=True)


# ---------------------------------------------------------------------------
# Lab profile response serializer
# ---------------------------------------------------------------------------

class LabProfileSerializer(serializers.Serializer):
    """Reads normalized flat DB dict and shapes it into a nested response."""

    lab_id              = serializers.UUIDField()
    user                = serializers.SerializerMethodField()
    lab_name            = serializers.CharField()
    license_number      = serializers.CharField(allow_null=True)
    phone_number        = serializers.CharField(allow_null=True)
    lab_logo            = serializers.CharField()
    verification_status = serializers.CharField()
    verified_at         = serializers.DateTimeField(allow_null=True)
    verification_notes  = serializers.CharField(allow_null=True)
    is_active           = serializers.BooleanField()
    created_at          = serializers.DateTimeField(source="lab_created_at")
    updated_at          = serializers.DateTimeField(source="lab_updated_at", allow_null=True)

    address         = serializers.SerializerMethodField()
    verified_by     = serializers.SerializerMethodField()
    operating_hours = serializers.SerializerMethodField()
    services        = serializers.SerializerMethodField()

    def _d(self, obj):
        return obj if isinstance(obj, dict) else {}

    def get_user(self, obj):
        return _UserOut(self._d(obj)).data

    def get_address(self, obj):
        d = self._d(obj)
        if not d.get("address_id"):
            return None
        return _AddressOut({
            "address_id":   d["address_id"],
            "address_line": d.get("address_line", ""),
            "city":         d.get("city", ""),
            "state":        d.get("state", ""),
            "pincode":      d.get("pincode", ""),
        }).data

    def get_verified_by(self, obj):
        d = self._d(obj)
        if not d.get("verified_by_id"):
            return None
        return {"user_id": str(d["verified_by_id"]), "email": d.get("verified_by_email")}

    def get_operating_hours(self, obj):
        return LabOperatingHourSerializer(self._d(obj).get("operating_hours", []), many=True).data

    def get_services(self, obj):
        return LabServiceSerializer(self._d(obj).get("services", []), many=True).data


# ---------------------------------------------------------------------------
# Lab registration serializer
# ---------------------------------------------------------------------------

class LabRegistrationSerializer(serializers.Serializer):
    email             = serializers.EmailField(required=True)
    password          = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm  = serializers.CharField(write_only=True, required=True)
    oauth_provider    = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    oauth_provider_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    lab_name          = serializers.CharField(required=True, max_length=255)
    license_number    = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    phone_number      = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=15)
    lab_logo          = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_line      = serializers.CharField(required=True)
    city              = serializers.CharField(required=True, max_length=100)
    state             = serializers.CharField(required=True, max_length=100)
    pincode           = serializers.CharField(required=True, max_length=10)
    operating_hours   = LabOperatingHourSerializer(many=True, required=False)
    services          = LabServiceSerializer(many=True, required=False)

    def validate_email(self, value):
        if uq.email_exists(value):
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_license_number(self, value):
        if value and lq.license_exists(value):
            raise serializers.ValidationError("A lab with this license number already exists.")
        return value

    def validate(self, attrs):
        password_confirm = attrs.pop("password_confirm", None)
        if attrs["password"] != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs


# ---------------------------------------------------------------------------
# Lab profile update serializer
# ---------------------------------------------------------------------------

class LabProfileUpdateSerializer(serializers.Serializer):
    lab_name         = serializers.CharField(required=False, max_length=255)
    license_number   = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    phone_number     = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=15)
    lab_logo         = serializers.CharField(required=False)
    address_line     = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    city             = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    state            = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    pincode          = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=10)
    operating_hours  = LabOperatingHourSerializer(many=True, required=False)
    services         = LabServiceSerializer(many=True, required=False)

    def validate_license_number(self, value):
        if not value:
            return value
        # BUG FIX: use "lab_id" context key (consistent with view)
        lab_id = self.context.get("lab_id")
        if lq.license_exists(value, exclude_lab_id=lab_id):
            raise serializers.ValidationError("A lab with this license number already exists.")
        return value