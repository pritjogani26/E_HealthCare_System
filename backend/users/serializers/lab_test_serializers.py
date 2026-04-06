from rest_framework import serializers

class LabTestCategorySerializer(serializers.Serializer):
    category_id = serializers.IntegerField(read_only=True)
    category_name = serializers.CharField(max_length=100)
    description = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    is_active = serializers.BooleanField(default=True)
    created_by = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_by = serializers.UUIDField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    total_count = serializers.IntegerField(read_only=True, required=False)

class TestParameterInlineSerializer(serializers.Serializer):
    parameter_id = serializers.IntegerField(read_only=True)
    parameter_name = serializers.CharField(max_length=255)
    unit = serializers.CharField(max_length=50, allow_blank=True, allow_null=True, required=False)
    normal_range = serializers.CharField(max_length=100, allow_blank=True, allow_null=True, required=False)

class LabTestSerializer(serializers.Serializer):
    test_id = serializers.IntegerField(read_only=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    test_code = serializers.CharField(max_length=30)
    test_name = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    sample_type = serializers.CharField(max_length=50)
    fasting_required = serializers.BooleanField(default=False)
    fasting_hours = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    turnaround_hours = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    total_count = serializers.IntegerField(read_only=True, required=False)
    parameters = TestParameterInlineSerializer(many=True, required=False)
