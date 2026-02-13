# Hospital_Management\backend\patient\patient_service\serializers.py
from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination


class PatientInsertSerializer(serializers.Serializer):
    patient_name = serializers.CharField(max_length=50)
    dob = serializers.DateField()
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=15, required=False)
    gender = serializers.ChoiceField(choices=["M", "F"])
    blood_group = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    address = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    profile_image = serializers.ImageField(required=False, allow_null=True)
    created_by = serializers.IntegerField()


class PatientListSerializer(serializers.Serializer):
    patient_id = serializers.IntegerField()
    patient_name = serializers.CharField()
    email = serializers.EmailField(allow_null=True)
    mobile = serializers.CharField(allow_null=True)
    gender = serializers.ChoiceField(choices=["M", "F"])
    status = serializers.ChoiceField(
        choices=["A", "D"], required=False, allow_null=True
    )


class PatientDisplaySerializer(serializers.Serializer):
    patient_id = serializers.IntegerField()
    patient_name = serializers.CharField(max_length=50)
    dob = serializers.DateField(required=False, allow_null=True)
    email = serializers.EmailField(required=False, allow_null=True)
    mobile = serializers.CharField(max_length=15, required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=["M", "F"])
    blood_group = serializers.CharField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_null=True)
    profile_image = serializers.CharField(required=False, allow_null=True)
    status = serializers.ChoiceField(
        choices=["A", "D"], required=False, allow_null=True
    )
    created_at = serializers.DateTimeField(required=False, allow_null=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    updated_at = serializers.DateTimeField(required=False, allow_null=True)
    updated_by = serializers.IntegerField(required=False, allow_null=True)
    update_reason = serializers.CharField(required=False, allow_null=True)


class PatientUpdateSerializer(serializers.Serializer):
    patient_name = serializers.CharField(max_length=50)
    dob = serializers.DateField(required=False, allow_null=True)
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=15, required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=["M", "F"])
    blood_group = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    profile_image = serializers.ImageField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    updated_by = serializers.IntegerField()
    update_reason = serializers.CharField(max_length=100)


class DeleteSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=200)
    deleteBy = serializers.CharField(max_length=50)


class PatientSetPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 15
