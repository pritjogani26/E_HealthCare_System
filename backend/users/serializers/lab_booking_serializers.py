# backend\users\serializers\lab_booking_serializers.py
from rest_framework import serializers


COLLECTION_TYPES = ("lab_visit", "home")
BOOKING_STATUSES = ("BOOKED", "COMPLETED", "CANCELLED")
REPORT_TYPES = ("pdf", "image", "csv", "other")


class CollectionAddressSerializer(serializers.Serializer):
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(
        max_length=255, allow_blank=True, allow_null=True, required=False
    )
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(
        max_length=100, allow_blank=True, allow_null=True, required=False
    )
    pincode = serializers.CharField(
        max_length=20, allow_blank=True, allow_null=True, required=False
    )
    landmark = serializers.CharField(
        max_length=255, allow_blank=True, allow_null=True, required=False
    )


class CreateBookingSerializer(serializers.Serializer):

    lab_id = serializers.UUIDField()
    slot_id = serializers.IntegerField(min_value=1)
    test_id = serializers.IntegerField(min_value=1)
    collection_type = serializers.ChoiceField(choices=COLLECTION_TYPES)
    collection_address = CollectionAddressSerializer(required=False, allow_null=True)
    notes = serializers.CharField(
        max_length=1000, allow_blank=True, allow_null=True, required=False
    )

    def validate(self, data):
        if data.get("collection_type") == "home":
            if not data.get("collection_address"):
                raise serializers.ValidationError(
                    {
                        "collection_address": (
                            "collection_address is required for home collection."
                        )
                    }
                )
        return data


class CancelBookingSerializer(serializers.Serializer):
    cancellation_reason = serializers.CharField(
        max_length=500, allow_blank=True, allow_null=True, required=False
    )


class CompleteBookingSerializer(serializers.Serializer):
    report_file = serializers.FileField(required=False, allow_null=True)
    report_type = serializers.ChoiceField(
        choices=REPORT_TYPES, default="pdf", required=False
    )
    result_notes = serializers.CharField(
        max_length=5000, allow_blank=True, allow_null=True, required=False
    )
    parameter_results = serializers.JSONField(required=False, allow_null=True)


class PatientBookingSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField()
    date_of_birth = serializers.DateField()
    mobile = serializers.CharField()
    emergency_contact_name = serializers.CharField(allow_blank=True, allow_null=True)
    emergency_contact_number = serializers.CharField(allow_blank=True, allow_null=True)
    blood_group = serializers.CharField(allow_blank=True, allow_null=True)
    gender = serializers.CharField(allow_blank=True, allow_null=True)
    address_line = serializers.CharField(allow_blank=True, allow_null=True)
    city = serializers.CharField(allow_blank=True, allow_null=True)
    state = serializers.CharField(allow_blank=True, allow_null=True)
    pincode = serializers.CharField(allow_blank=True, allow_null=True)


class BookingDetailSerializer(serializers.Serializer):
    booking_id = serializers.UUIDField(read_only=True)
    patient_id = serializers.UUIDField(read_only=True)
    lab_id = serializers.UUIDField(read_only=True)
    slot_id = serializers.IntegerField(read_only=True)
    test_id = serializers.IntegerField(read_only=True)
    collection_type = serializers.CharField(read_only=True)
    collection_address = serializers.JSONField(read_only=True, allow_null=True)
    booking_status = serializers.CharField(read_only=True)

    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    home_collection_charge = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    discount_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    total_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    patient = PatientBookingSerializer(read_only=True, allow_null=True, partial=True)

    notes = serializers.CharField(read_only=True, allow_null=True)

    cancelled_at = serializers.DateTimeField(read_only=True, allow_null=True)
    cancellation_reason = serializers.CharField(read_only=True, allow_null=True)
    cancelled_by = serializers.UUIDField(read_only=True, allow_null=True)

    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    test_name = serializers.CharField(read_only=True)
    test_code = serializers.CharField(read_only=True)
    sample_type = serializers.CharField(read_only=True)
    fasting_required = serializers.BooleanField(read_only=True)

    slot_date = serializers.DateField(read_only=True)
    start_time = serializers.TimeField(read_only=True)
    end_time = serializers.TimeField(read_only=True)

    lab_name = serializers.CharField(read_only=True)


class LabReportSerializer(serializers.Serializer):
    result_id = serializers.IntegerField(read_only=True)
    booking_id = serializers.UUIDField(read_only=True)
    report_file_url = serializers.CharField(max_length=255)
    report_type = serializers.ChoiceField(
        choices=REPORT_TYPES, default="pdf", required=False
    )
    result_notes = serializers.CharField(
        max_length=5000, allow_blank=True, allow_null=True, required=False
    )
    uploaded_by = serializers.UUIDField(read_only=True, allow_null=True)
    uploaded_at = serializers.DateTimeField(read_only=True)


class LabSlotSerializer(serializers.Serializer):
    slot_id = serializers.IntegerField(read_only=True)
    lab_id = serializers.UUIDField(read_only=True)
    slot_date = serializers.DateField(read_only=True)
    start_time = serializers.TimeField(read_only=True)
    end_time = serializers.TimeField(read_only=True)
    booked_count = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
