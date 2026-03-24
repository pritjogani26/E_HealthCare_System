# backend\doctors\serializers.py

import json
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from decimal import Decimal
import db.user_queries as uq
import db.doctor_queries as dq
from users.models import AppointmentType


class _UserOut(serializers.Serializer):
    doctor_id = serializers.UUIDField()
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


class WorkingDaySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    arrival = serializers.TimeField()
    leaving = serializers.TimeField()
    lunch_start = serializers.TimeField(allow_null=True)
    lunch_end = serializers.TimeField(allow_null=True)

    def validate(self, attrs):
        arrival = attrs.get("arrival")
        leaving = attrs.get("leaving")
        lunch_start = attrs.get("lunch_start")
        lunch_end = attrs.get("lunch_end")
        if arrival and leaving and arrival >= leaving:
            raise serializers.ValidationError("arrival must be before leaving.")
        if lunch_start and lunch_end and lunch_start >= lunch_end:
            raise serializers.ValidationError("lunch_start must be before lunch_end.")
        return attrs


class DoctorScheduleSerializer(serializers.Serializer):
    schedule_id = serializers.IntegerField(read_only=True)
    consultation_duration_min = serializers.IntegerField()
    appointment_contact = serializers.CharField(allow_null=True, allow_blank=True)
    working_days = WorkingDaySerializer(many=True, required=False)


class DoctorScheduleWriteSerializer(serializers.Serializer):
    consultation_duration_min = serializers.IntegerField(required=False, min_value=1)
    appointment_contact = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=15
    )
    working_days = WorkingDaySerializer(many=True, required=False)


class QualReadSerializer(serializers.Serializer):
    doctor_qualification_id = serializers.IntegerField(read_only=True)
    institution = serializers.CharField(allow_null=True)
    year_of_completion = serializers.IntegerField(allow_null=True)
    created_at = serializers.DateTimeField()
    qualification = serializers.SerializerMethodField()

    def get_qualification(self, obj):
        d = obj if isinstance(obj, dict) else {}
        return {
            "qualification_id": d.get("qualification_id"),
            "qualification_code": d.get("qualification_code"),
            "qualification_name": d.get("qualification_name"),
            "is_active": d.get("qual_is_active"),
        }


class SpecReadSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    is_primary = serializers.BooleanField()
    years_in_specialty = serializers.IntegerField(allow_null=True)
    created_at = serializers.DateTimeField()
    specialization = serializers.SerializerMethodField()

    def get_specialization(self, obj):
        d = obj if isinstance(obj, dict) else {}
        return {
            "specialization_id": d.get("specialization_id"),
            "specialization_name": d.get("specialization_name"),
            "description": d.get("description"),
            "is_active": d.get("spec_is_active"),
        }


class _QualWriteSerializer(serializers.Serializer):
    qualification_id = serializers.IntegerField()
    institution = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    year_of_completion = serializers.IntegerField(
        required=False, allow_null=True, min_value=1900
    )


class _SpecWriteSerializer(serializers.Serializer):
    specialization_id = serializers.IntegerField()
    is_primary = serializers.BooleanField(default=False)
    years_in_specialty = serializers.IntegerField(
        required=False, allow_null=True, min_value=0
    )


class DoctorProfileSerializer(serializers.Serializer):
    doctor_id = serializers.UUIDField()
    user = serializers.SerializerMethodField()
    full_name = serializers.CharField()
    experience_years = serializers.DecimalField(max_digits=6, decimal_places=2)
    phone_number = serializers.CharField()
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, allow_null=True
    )
    registration_number = serializers.CharField()
    profile_image = serializers.CharField()
    is_active = serializers.BooleanField()
    verification_status = serializers.CharField()
    verified_at = serializers.DateTimeField(allow_null=True)
    verification_notes = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField(allow_null=True)

    gender = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    verified_by = serializers.SerializerMethodField()
    schedule = serializers.SerializerMethodField()
    qualifications = serializers.SerializerMethodField()
    specializations = serializers.SerializerMethodField()

    def _d(self, obj):
        return obj if isinstance(obj, dict) else {}

    def get_user(self, obj):
        return obj
        # return _UserOut(self._d(obj)).data

    def get_gender(self, obj):
        d = self._d(obj)
        if not d.get("gender_id"):
            return None
        return {"gender_id": d["gender_id"], "gender_value": d.get("gender_value")}

    def get_address(self, obj):
        d = self._d(obj)
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

    def get_verified_by(self, obj):
        d = self._d(obj)
        if not d.get("verified_by_id"):
            return None
        return {
            "user_id": str(d["verified_by_id"]),
            "email": d.get("verified_by_email"),
        }

    def get_schedule(self, obj):
        sched = self._d(obj).get("schedule")
        if not sched:
            return None
        return DoctorScheduleSerializer(sched).data

    def get_qualifications(self, obj):
        return QualReadSerializer(
            self._d(obj).get("qualifications", []), many=True
        ).data

    def get_specializations(self, obj):
        return SpecReadSerializer(
            self._d(obj).get("specializations", []), many=True
        ).data


class DoctorRegistrationSerializer(serializers.Serializer):
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
    phone_number = serializers.CharField(required=True, max_length=15)
    registration_number = serializers.CharField(required=True, max_length=100)
    gender_id = serializers.IntegerField(required=True)
    experience_years = serializers.DecimalField(
        max_digits=6, decimal_places=2, default=Decimal("0.00"), min_value=0
    )
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, min_value=0
    )
    profile_image = serializers.FileField(required=False, allow_null=True)
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
    qualifications = _QualWriteSerializer(many=True, required=False)
    specializations = _SpecWriteSerializer(many=True, required=False)

    def to_internal_value(self, data):
        if hasattr(data, "dict"):
            data = data.dict()
        else:
            data = dict(data)
        for field_name in ("qualifications", "specializations"):
            val = data.get(field_name)
            if isinstance(val, str) and val.strip():
                try:
                    data[field_name] = json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    raise serializers.ValidationError(
                        {field_name: "Must be a valid JSON array."}
                    )
        return super().to_internal_value(data)

    def validate_full_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Full name is required.")
        if value.lower().startswith("dr"):
            name = value.split(".", 1)[-1] if "." in value else value[2:]
            return f"Dr. {name.strip().title()}"
        return f"Dr. {value.title()}"

    def validate_gender_id(self, value):
        if not uq.gender_exists(value):
            raise serializers.ValidationError("Invalid gender ID.")
        return value

    def validate(self, attrs):
        password_confirm = attrs.pop("password_confirm", None)
        if attrs["password"] != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs


class DoctorProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, max_length=255)
    gender_id = serializers.IntegerField(required=False, allow_null=True)
    experience_years = serializers.DecimalField(
        max_digits=6, decimal_places=2, required=False, min_value=0
    )
    phone_number = serializers.CharField(required=False, max_length=15)
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, min_value=0
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
    qualifications = _QualWriteSerializer(many=True, required=False)
    specializations = _SpecWriteSerializer(many=True, required=False)
    schedule = DoctorScheduleWriteSerializer(required=False)



class AppointmentSlotSerializer(serializers.Serializer):
    slot_id = serializers.IntegerField()
    slot_date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    is_booked = serializers.BooleanField()
    is_blocked = serializers.BooleanField()
    is_available = serializers.SerializerMethodField()

    def get_is_available(self, obj):
        d = obj if isinstance(obj, dict) else {}
        return (
            not d.get("is_booked")
            and not d.get("is_blocked")
            and d.get("slot_date") >= timezone.localdate()
        )


class BookAppointmentSerializer(serializers.Serializer):
    slot_id = serializers.IntegerField()
    reason = serializers.CharField(required=False, allow_blank=True, default="")
    appointment_type = serializers.ChoiceField(
        choices=AppointmentType.choices,
        default=AppointmentType.IN_PERSON,
    )

    def validate_slot_id(self, value):
        if not dq.slot_exists(value):
            raise serializers.ValidationError("Slot not found.")
        return value


class DoctorAppointmentSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField()
    doctor_id = serializers.UUIDField()
    doctor_name = serializers.CharField()
    patient_id = serializers.UUIDField()
    patient_email = serializers.CharField()
    slot_id = serializers.IntegerField(allow_null=True)
    slot_date = serializers.DateField(allow_null=True)
    start_time = serializers.TimeField(allow_null=True)
    end_time = serializers.TimeField(allow_null=True)
    appointment_type = serializers.CharField()
    status = serializers.CharField()
    reason = serializers.CharField(allow_null=True)
    cancellation_reason = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class DoctorListSerializer(serializers.Serializer):
    doctor_id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField()
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, allow_null=True
    )
    experience_years = serializers.DecimalField(max_digits=6, decimal_places=2)
    registration_number = serializers.CharField()
    is_active = serializers.BooleanField()
    verification_status = serializers.CharField()
    verification_notes = serializers.CharField(allow_blank=True, allow_null=True)
    verified_at = serializers.DateTimeField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    gender = serializers.CharField()
    verified_by_id = serializers.UUIDField(required=False, allow_null=True)
    verified_by_email = serializers.EmailField(
        required=False, allow_blank=True, allow_null=True
    )

