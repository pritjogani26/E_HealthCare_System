# users\serializers\payment_serializers.py
from rest_framework import serializers


class CreateOrderSerializer(serializers.Serializer):
    payment_for = serializers.ChoiceField(choices=["APPOINTMENT", "LAB_TEST"])
    reference_id = serializers.CharField(max_length=100)

    def validate_reference_id(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("reference_id cannot be empty.")
        return value


class VerifyPaymentSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(max_length=100)
    razorpay_payment_id = serializers.CharField(max_length=100)
    razorpay_signature = serializers.CharField(max_length=500)


class RefundPaymentSerializer(serializers.Serializer):
    payment_for = serializers.ChoiceField(choices=["APPOINTMENT", "LAB_TEST"])
    reference_id = serializers.CharField(max_length=100)


class PaymentHistoryQuerySerializer(serializers.Serializer):
    payment_for = serializers.ChoiceField(
        choices=["APPOINTMENT", "LAB_TEST"],
        required=False
    )
    status = serializers.ChoiceField(
        choices=["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
        required=False
    )
    limit = serializers.IntegerField(min_value=1, max_value=100, default=20)
    offset = serializers.IntegerField(min_value=0, default=0)