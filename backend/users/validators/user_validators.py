# backend/users/validators/user_validators.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Patient, Doctor, Lab

User = get_user_model()


def validate_email_unique(email):
    """
    Validate that email is unique in the system.
    
    Args:
        email: Email address to validate
    
    Raises:
        serializers.ValidationError: If email already exists
    
    Returns:
        str: The validated email
    """
    if User.objects.filter(email=email).exists():
        raise serializers.ValidationError("A user with this email already exists.")
    return email


def validate_mobile_unique(mobile):
    """
    Validate that mobile number is unique in the Patient table.
    
    Args:
        mobile: Mobile number to validate
    
    Raises:
        serializers.ValidationError: If mobile already exists
    
    Returns:
        str: The validated mobile number
    """
    if Patient.objects.filter(mobile=mobile).exists():
        raise serializers.ValidationError("A patient with this mobile number already exists.")
    return mobile


def validate_phone_unique(phone_number):
    """
    Validate that phone number is unique in the Doctor table.
    
    Args:
        phone_number: Phone number to validate
    
    Raises:
        serializers.ValidationError: If phone already exists
    
    Returns:
        str: The validated phone number
    """
    if Doctor.objects.filter(phone_number=phone_number).exists():
        raise serializers.ValidationError("A doctor with this phone number already exists.")
    return phone_number


def validate_registration_number_unique(registration_number):
    """
    Validate that registration number is unique in the Doctor table.
    
    Args:
        registration_number: Registration number to validate
    
    Raises:
        serializers.ValidationError: If registration number already exists
    
    Returns:
        str: The validated registration number
    """
    if Doctor.objects.filter(registration_number=registration_number).exists():
        raise serializers.ValidationError("A doctor with this registration number already exists.")
    return registration_number


def validate_license_number_unique(license_number):
    """
    Validate that license number is unique in the Lab table.
    
    Args:
        license_number: License number to validate
    
    Raises:
        serializers.ValidationError: If license number already exists
    
    Returns:
        str: The validated license number
    """
    if Lab.objects.filter(license_number=license_number).exists():
        raise serializers.ValidationError("A lab with this license number already exists.")
    return license_number
