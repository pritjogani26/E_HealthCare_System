from rest_framework import serializers
import db.user_queries as uq
import db.patient_queries as pq
import db.doctor_queries as dq
import db.lab_queries as lq


def validate_email_unique(email: str) -> str:
    if uq.email_exists(email):
        raise serializers.ValidationError("A user with this email already exists.")
    return email


def validate_mobile_unique(mobile: str) -> str:
    if pq.mobile_exists(mobile):
        raise serializers.ValidationError(
            "A patient with this mobile number already exists."
        )
    return mobile


def validate_phone_unique(phone_number: str) -> str:
    if dq.phone_exists(phone_number):
        raise serializers.ValidationError(
            "A doctor with this phone number already exists."
        )
    return phone_number


def validate_registration_number_unique(registration_number: str) -> str:
    if dq.registration_number_exists(registration_number):
        raise serializers.ValidationError(
            "A doctor with this registration number already exists."
        )
    return registration_number


def validate_license_number_unique(license_number: str) -> str:
    if license_number and lq.license_exists(license_number):
        raise serializers.ValidationError(
            "A lab with this license number already exists."
        )
    return license_number
