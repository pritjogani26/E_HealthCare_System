# backend/users/serializers/prescription_serializers.py

from rest_framework import serializers


FREQUENCY_CHOICES = [
    "once_daily",
    "twice_daily",
    "thrice_daily",
    "four_times_daily",
    "as_needed",
    "at_bedtime",
]

INSTRUCTION_CHOICES = [
    "after_food",
    "before_food",
    "with_food",
    "empty_stomach",
    "at_bedtime",
    "with_water",
]


class MedicineInputSerializer(serializers.Serializer):
    medicine_name = serializers.CharField(max_length=255)
    dosage        = serializers.CharField(max_length=100,  required=False, allow_blank=True)
    frequency     = serializers.ChoiceField(choices=FREQUENCY_CHOICES, required=False, allow_null=True)
    duration      = serializers.CharField(max_length=100,  required=False, allow_blank=True)
    instructions  = serializers.ChoiceField(choices=INSTRUCTION_CHOICES, required=False, allow_null=True)


class PrescriptionCreateSerializer(serializers.Serializer):
    clinical_notes = serializers.CharField(required=False, allow_blank=True)
    medicines      = MedicineInputSerializer(many=True, required=False, default=list)
    lab_tests      = serializers.CharField(required=False, allow_blank=True)
    advice         = serializers.CharField(required=False, allow_blank=True)
    follow_up_date = serializers.DateField(required=False, allow_null=True)


class MedicineOutputSerializer(serializers.Serializer):
    medicine_id   = serializers.IntegerField()
    medicine_name = serializers.CharField()
    dosage        = serializers.CharField(allow_null=True)
    frequency     = serializers.CharField(allow_null=True)
    duration      = serializers.CharField(allow_null=True)
    instructions  = serializers.CharField(allow_null=True)
    sort_order    = serializers.IntegerField()


class PrescriptionOutputSerializer(serializers.Serializer):
    prescription_id     = serializers.UUIDField()
    appointment_id      = serializers.IntegerField()
    prescription_number = serializers.CharField()
    clinical_notes      = serializers.CharField(allow_null=True)
    lab_tests           = serializers.CharField(allow_null=True)
    advice              = serializers.CharField(allow_null=True)
    follow_up_date      = serializers.DateField(allow_null=True)
    pdf_path            = serializers.CharField(allow_null=True)
    pdf_url             = serializers.SerializerMethodField()
    medicines           = MedicineOutputSerializer(many=True, default=list)
    created_at          = serializers.DateTimeField()

    def get_pdf_url(self, obj):
        request = self.context.get("request")
        pdf = obj.get("pdf_path")
        if not pdf or not request:
            return None
        from django.conf import settings
        media_url = getattr(settings, "MEDIA_URL", "/media/")
        base = request.build_absolute_uri(media_url)
        return base + pdf.replace("\\", "/")


class PatientPrescriptionListSerializer(serializers.Serializer):
    prescription_id     = serializers.UUIDField()
    appointment_id      = serializers.IntegerField()
    prescription_number = serializers.CharField()
    doctor_name         = serializers.CharField()
    slot_date           = serializers.DateField(allow_null=True)
    pdf_path            = serializers.CharField(allow_null=True)
    pdf_url             = serializers.SerializerMethodField()
    created_at          = serializers.DateTimeField()

    def get_pdf_url(self, obj):
        request = self.context.get("request")
        pdf = obj.get("pdf_path")
        if not pdf or not request:
            return None
        from django.conf import settings
        media_url = getattr(settings, "MEDIA_URL", "/media/")
        base = request.build_absolute_uri(media_url)
        return base + pdf.replace("\\", "/")