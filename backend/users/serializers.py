# backend/users/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from decimal import Decimal
from .models import (
    Patient, Doctor, Lab, Gender, BloodGroup, 
    Qualification, DoctorQualification, UserRole,
    GenderChoice, VerificationStatus
)

User = get_user_model()


class GenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gender
        fields = ['gender_id', 'gender_value']


class BloodGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodGroup
        fields = ['blood_group_id', 'blood_group_value']


class QualificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Qualification
        fields = ['qualification_id', 'qualification_code', 'qualification_name', 'is_active']


class DoctorQualificationSerializer(serializers.ModelSerializer):
    qualification_details = QualificationSerializer(source='qualification', read_only=True)
    qualification = serializers.PrimaryKeyRelatedField(queryset=Qualification.objects.all())
    
    class Meta:
        model = DoctorQualification
        fields = [
            'doctor_qualification_id', 'qualification', 'qualification_details',
            'institution', 'year_of_completion', 'created_at'
        ]
        read_only_fields = ['doctor_qualification_id', 'created_at']


# ===================================================================================
# ============================ REGISTRATION SERIALIZERS =============================
# ===================================================================================

class PatientRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    # OAuth fields
    oauth_provider = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    oauth_provider_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Patient fields
    full_name = serializers.CharField(required=True, max_length=255)
    mobile = serializers.CharField(required=True, max_length=15)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender_id = serializers.IntegerField(required=True)
    blood_group_id = serializers.IntegerField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    state = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    pincode = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=10)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm',
            'oauth_provider', 'oauth_provider_id',
            'full_name', 'mobile', 'date_of_birth', 
            'gender_id', 'blood_group_id', 'address',
            'city', 'state', 'pincode'
        ]
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_mobile(self, value):
        if Patient.objects.filter(mobile=value).exists():
            raise serializers.ValidationError("A patient with this mobile number already exists.")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        # Extract patient-specific fields
        full_name = validated_data.pop('full_name')
        mobile = validated_data.pop('mobile')
        date_of_birth = validated_data.pop('date_of_birth', None)
        gender_id = validated_data.pop('gender_id')
        blood_group_id = validated_data.pop('blood_group_id', None)
        address = validated_data.pop('address', None)
        city = validated_data.pop('city', None)
        state = validated_data.pop('state', None)
        pincode = validated_data.pop('pincode', None)
        validated_data.pop('password_confirm')
        
        # Extract OAuth fields
        oauth_provider = validated_data.pop('oauth_provider', None)
        oauth_provider_id = validated_data.pop('oauth_provider_id', None)
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=UserRole.PATIENT,
            oauth_provider=oauth_provider,
            oauth_provider_id=oauth_provider_id
        )
        
        # Get blood group if provided
        blood_group = None
        if blood_group_id:
            try:
                blood_group = BloodGroup.objects.get(blood_group_id=blood_group_id)
            except BloodGroup.DoesNotExist:
                pass
        
                pass
        
        # Get gender
        gender = None
        if gender_id:
            try:
                gender = Gender.objects.get(gender_id=gender_id)
            except Gender.DoesNotExist:
                pass

        # Create patient profile
        Patient.objects.create(
            user=user,
            full_name=full_name,
            mobile=mobile,
            date_of_birth=date_of_birth,
            gender=gender,
            blood_group=blood_group,
            address=address,
            city=city,
            state=state,
            pincode=pincode
        )
        
        return user


class DoctorRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    # OAuth fields
    oauth_provider = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    oauth_provider_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Doctor fields
    full_name = serializers.CharField(required=True, max_length=255)
    phone_number = serializers.CharField(required=True, max_length=15)
    registration_number = serializers.CharField(required=True, max_length=100)
    gender_id = serializers.IntegerField(required=True)
    experience_years = serializers.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    consultation_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    qualifications = DoctorQualificationSerializer(many=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm',
            'oauth_provider', 'oauth_provider_id',
            'full_name', 'phone_number', 'registration_number',
            'gender_id', 'experience_years', 'consultation_fee',
            'qualifications'
        ]
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_phone_number(self, value):
        if Doctor.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A doctor with this phone number already exists.")
        return value
    
    def validate_registration_number(self, value):
        if Doctor.objects.filter(registration_number=value).exists():
            raise serializers.ValidationError("A doctor with this registration number already exists.")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        # Validate gender exists
        gender_id = attrs.get('gender_id')
        if not Gender.objects.filter(gender_id=gender_id).exists():
            raise serializers.ValidationError({"gender_id": "Invalid gender ID."})
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        # Extract doctor-specific fields
        full_name = validated_data.pop('full_name')
        phone_number = validated_data.pop('phone_number')
        registration_number = validated_data.pop('registration_number')
        gender_id = validated_data.pop('gender_id')
        experience_years = validated_data.pop('experience_years', Decimal("0.00"))
        consultation_fee = validated_data.pop('consultation_fee', None)
        qualifications_data = validated_data.pop('qualifications', [])
        validated_data.pop('password_confirm')
        
        # Extract OAuth fields
        oauth_provider = validated_data.pop('oauth_provider', None)
        oauth_provider_id = validated_data.pop('oauth_provider_id', None)
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=UserRole.DOCTOR,
            oauth_provider=oauth_provider,
            oauth_provider_id=oauth_provider_id
        )
        
        # Get gender
        gender = Gender.objects.get(gender_id=gender_id)
        
        # Create doctor profile
        doctor = Doctor.objects.create(
            user=user,
            full_name=full_name,
            phone_number=phone_number,
            registration_number=registration_number,
            gender=gender,
            experience_years=experience_years,
            consultation_fee=consultation_fee,
            verification_status=VerificationStatus.PENDING
        )
        
        # Create qualifications
        for qual_data in qualifications_data:
            qualification = qual_data.get('qualification')
            if qualification:
                DoctorQualification.objects.create(
                    doctor=doctor,
                    qualification=qualification,
                    institution=qual_data.get('institution'),
                    year_of_completion=qual_data.get('year_of_completion')
                )
        
        return user


class LabRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    # OAuth fields
    oauth_provider = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    oauth_provider_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Lab fields
    lab_name = serializers.CharField(required=True, max_length=255)
    license_number = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    address = serializers.CharField(required=True)
    city = serializers.CharField(required=True, max_length=100)
    state = serializers.CharField(required=True, max_length=100)
    pincode = serializers.CharField(required=True, max_length=10)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=15)
    operating_hours = serializers.JSONField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm',
            'oauth_provider', 'oauth_provider_id',
            'lab_name', 'license_number', 'address',
            'city', 'state', 'pincode', 'phone_number',
            'operating_hours'
        ]
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_license_number(self, value):
        if value and Lab.objects.filter(license_number=value).exists():
            raise serializers.ValidationError("A lab with this license number already exists.")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        # Extract lab-specific fields
        lab_name = validated_data.pop('lab_name')
        license_number = validated_data.pop('license_number', None)
        address = validated_data.pop('address')
        city = validated_data.pop('city')
        state = validated_data.pop('state')
        pincode = validated_data.pop('pincode')
        phone_number = validated_data.pop('phone_number', None)
        operating_hours = validated_data.pop('operating_hours', None)
        validated_data.pop('password_confirm')
        
        # Extract OAuth fields
        oauth_provider = validated_data.pop('oauth_provider', None)
        oauth_provider_id = validated_data.pop('oauth_provider_id', None)
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=UserRole.LAB,
            oauth_provider=oauth_provider,
            oauth_provider_id=oauth_provider_id
        )
        
        # Create lab profile
        Lab.objects.create(
            user=user,
            lab_name=lab_name,
            license_number=license_number,
            address=address,
            city=city,
            state=state,
            pincode=pincode,
            phone_number=phone_number,
            operating_hours=operating_hours,
            verification_status=VerificationStatus.PENDING
        )
        
        return user



class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'user_id', 'email', 'email_verified', 'role',
            'account_status', 'is_active', 'is_staff',
            'two_factor_enabled', 'created_at', 'updated_at', 
            'last_login_at'
        ]
        read_only_fields = ['user_id', 'created_at', 'updated_at', 'last_login_at']


class PatientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    blood_group_details = BloodGroupSerializer(source='blood_group', read_only=True)
    gender_details = GenderSerializer(source='gender', read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            'patient_id', 'user', 'full_name', 'date_of_birth',
            'gender', 'gender_details', 'blood_group', 'blood_group_details',
            'mobile', 'emergency_contact_name', 'emergency_contact_phone',
            'address', 'city', 'state', 'pincode',
            'profile_image', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['patient_id', 'user', 'created_at', 'updated_at']


class PatientProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            'full_name', 'date_of_birth', 'gender', 'blood_group',
            'mobile', 'emergency_contact_name', 'emergency_contact_phone',
            'address', 'city', 'state', 'pincode', 'profile_image'
        ]
    
    def validate_mobile(self, value):
        # Exclude current instance from unique check
        instance = self.instance
        if Patient.objects.filter(mobile=value).exclude(patient_id=instance.patient_id).exists():
            raise serializers.ValidationError("A patient with this mobile number already exists.")
        return value


class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    gender_details = GenderSerializer(source='gender', read_only=True)
    qualifications = DoctorQualificationSerializer(many=True, read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    verified_by_details = UserSerializer(source='verified_by', read_only=True)
    
    class Meta:
        model = Doctor
        fields = [
            'user', 'full_name', 'gender', 'gender_details',
            'experience_years', 'phone_number', 'consultation_fee',
            'registration_number', 'profile_image', 'joining_date',
            'is_active', 'verification_status', 'verification_status_display',
            'verified_by', 'verified_by_details', 'verified_at', 'verification_notes',
            'qualifications', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'user', 'verification_status', 'verified_by', 
            'verified_at', 'verification_notes', 'created_at', 'updated_at'
        ]


class DoctorProfileUpdateSerializer(serializers.ModelSerializer):
    qualifications = DoctorQualificationSerializer(many=True, required=False)
    
    class Meta:
        model = Doctor
        fields = [
            'full_name', 'gender', 'experience_years',
            'phone_number', 'consultation_fee', 'profile_image',
            'qualifications'
        ]
    
    def validate_phone_number(self, value):
        instance = self.instance
        if Doctor.objects.filter(phone_number=value).exclude(user=instance.user).exists():
            raise serializers.ValidationError("A doctor with this phone number already exists.")
        return value
    
    @transaction.atomic
    def update(self, instance, validated_data):
        qualifications_data = validated_data.pop('qualifications', None)
        
        # Update doctor fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update qualifications if provided
        if qualifications_data is not None:
            # Remove existing qualifications
            instance.qualifications.all().delete()
            
            # Add new qualifications
            for qual_data in qualifications_data:
                qualification = qual_data.get('qualification')
                if qualification:
                    DoctorQualification.objects.create(
                        doctor=instance,
                        qualification=qualification,
                        institution=qual_data.get('institution'),
                        year_of_completion=qual_data.get('year_of_completion')
                    )
        
        return instance


class LabProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    verified_by_details = UserSerializer(source='verified_by', read_only=True)
    
    class Meta:
        model = Lab
        fields = [
            'user', 'lab_name', 'license_number', 'address',
            'city', 'state', 'pincode', 'phone_number',
            'lab_logo', 'verification_status', 'verification_status_display',
            'verified_by', 'verified_by_details', 'verified_at', 'verification_notes',
            'operating_hours', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'user', 'verification_status', 'verified_by',
            'verified_at', 'verification_notes', 'created_at', 'updated_at'
        ]


class LabProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lab
        fields = [
            'lab_name', 'license_number', 'address',
            'city', 'state', 'pincode', 'phone_number',
            'lab_logo', 'operating_hours'
        ]
    
    def validate_license_number(self, value):
        if not value:
            return value
        instance = self.instance
        if Lab.objects.filter(license_number=value).exclude(user=instance.user).exists():
            raise serializers.ValidationError("A lab with this license number already exists.")
        return value

class AdminStaffProfileSerializer(serializers.ModelSerializer):
    """Serializer for Admin and Staff users"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    account_status_display = serializers.CharField(source='get_account_status_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'user_id', 'email', 'email_verified', 'role', 'role_display',
            'account_status', 'account_status_display', 'is_active', 
            'is_staff', 'is_superuser', 'two_factor_enabled', 
            'created_at', 'updated_at', 'last_login_at'
        ]
        read_only_fields = ['user_id', 'created_at', 'updated_at', 'last_login_at']