# backend\users\serializers\test_parameter_serializers.py
from rest_framework import serializers

class TestParameterSerializer(serializers.Serializer):
    parameter_id = serializers.IntegerField(read_only=True)
    test_id = serializers.IntegerField()
    test_name = serializers.CharField(read_only=True, required=False)
    parameter_name = serializers.CharField(max_length=255)
    unit = serializers.CharField(max_length=50, allow_blank=True, allow_null=True, required=False)
    normal_range = serializers.CharField(max_length=100, allow_blank=True, allow_null=True, required=False)
    total_count = serializers.IntegerField(read_only=True, required=False)

class TestParameterUpdateSerializer(serializers.Serializer):
    test_id = serializers.IntegerField(required=False)
    parameter_name = serializers.CharField(max_length=255, required=False)
    unit = serializers.CharField(max_length=50, allow_blank=True, allow_null=True, required=False)
    normal_range = serializers.CharField(max_length=100, allow_blank=True, allow_null=True, required=False)
