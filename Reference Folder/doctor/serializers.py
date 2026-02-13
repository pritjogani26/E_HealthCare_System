# Hospital_Management\backend\doctor\serializers.py
import re
from rest_framework import serializers

import re
from rest_framework import serializers


class BaseValidation:
    @staticmethod
    def validate_phone_number(value):
        value = str(value)
        if not re.match(r"^[6-9]\d{9}$", value):
            raise serializers.ValidationError(
                "Enter a valid 10-digit Indian mobile number."
            )
        return value

    @staticmethod
    def validate_qualification_ids(value):
        if len(set(value)) != len(value):
            raise serializers.ValidationError(
                "Duplicate qualification IDs are not allowed."
            )
        return value


class RegisterDoctorSerializer(BaseValidation, serializers.Serializer):
    full_name = serializers.CharField(min_length=2, max_length=255)
    experience_years = serializers.DecimalField(
        max_digits=4, decimal_places=2, min_value=0
    )
    gender_id = serializers.IntegerField(required=False, allow_null=True)
    phone_number = serializers.CharField(
        validators=[BaseValidation.validate_phone_number]
    )
    email = serializers.EmailField(required=False, allow_null=True)
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, required=False, allow_null=True
    )
    profile_image = serializers.ImageField(required=False, allow_null=True)
    joining_date = serializers.DateField(required=False, allow_null=True)
    qualification_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), allow_empty=False
    )

    # def validate_qualification_ids(self, value):
    #     return self.validate_qualification_ids(value)


class UpdateDoctorSerializer(BaseValidation, serializers.Serializer):
    full_name = serializers.CharField(min_length=2, max_length=255)
    experience_years = serializers.DecimalField(
        max_digits=4, decimal_places=2, min_value=0
    )
    gender_id = serializers.IntegerField(required=False, allow_null=True)
    phone_number = serializers.CharField(
        validators=[BaseValidation.validate_phone_number]
    )
    email = serializers.EmailField(required=False, allow_null=True)
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, required=False, allow_null=True
    )
    profile_image = serializers.ImageField(required=False, allow_null=True)
    # qualification_ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False)
    qualification_ids = serializers.CharField()

    def validate_qualification_ids(self, value):
        """
        Handles:
        - "1,3"
        - ["1","3"]
        - [1,3]
        """
        if isinstance(value, list):
            ids = value
        else:
            ids = str(value).split(",")

        try:
            ids = [int(x) for x in ids if str(x).strip()]
        except ValueError:
            raise serializers.ValidationError("Invalid qualification IDs")

        if not ids:
            raise serializers.ValidationError("At least one qualification is required")

        return ids

    # def validate_qualification_ids(self, value):
    #     return self.validate_qualification_ids(value)


class DoctorProfileSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField()
    full_name = serializers.CharField()
    experience_years = serializers.DecimalField(max_digits=4, decimal_places=2)
    gender_id = serializers.IntegerField(allow_null=True)
    phone_number = serializers.CharField()
    email = serializers.EmailField(allow_null=True)
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, allow_null=True
    )
    profile_image = serializers.CharField(allow_null=True)
    joining_date = serializers.DateField(allow_null=True)
    qualification_ids = serializers.ListField(child=serializers.IntegerField())
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)


class DoctorListSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField()
    full_name = serializers.CharField()
    gender = serializers.CharField(allow_null=True)
    email = serializers.EmailField(allow_null=True)
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, allow_null=True
    )
    qualifications = serializers.ListField(child=serializers.CharField())


class GenderSerializer(serializers.Serializer):
    gender_id = serializers.IntegerField()
    gender_value = serializers.CharField()


class QualificationSerializer(serializers.Serializer):
    qualification_id = serializers.IntegerField()
    qualification_code = serializers.CharField()
    qualification_name = serializers.CharField()
