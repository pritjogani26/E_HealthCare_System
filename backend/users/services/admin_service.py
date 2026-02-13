# backend/users/services/admin_service.py

from django.utils import timezone
from ..models import Patient, Doctor, Lab, VerificationStatus


class AdminService:
    """
    Service layer for admin-related operations.
    Handles patient/doctor/lab verification and status toggles.
    """

    @staticmethod
    def toggle_patient_status(patient):
        """
        Toggle patient active status and sync with user account.
        
        Args:
            patient: Patient instance
        
        Returns:
            tuple: (patient, action_name)
        """
        patient.is_active = not patient.is_active
        patient.save()

        # Sync with user account
        user = patient.user
        user.is_active = patient.is_active
        user.save()

        action = "activated" if patient.is_active else "deactivated"
        return patient, action

    @staticmethod
    def toggle_doctor_status(doctor):
        """
        Toggle doctor active status and sync with user account.
        
        Args:
            doctor: Doctor instance
        
        Returns:
            tuple: (doctor, action_name)
        """
        doctor.is_active = not doctor.is_active
        doctor.save()

        # Sync with user account
        user = doctor.user
        user.is_active = doctor.is_active
        user.save()

        action = "activated" if doctor.is_active else "deactivated"
        return doctor, action

    @staticmethod
    def verify_doctor(doctor, status, notes, verified_by):
        """
        Verify or reject a doctor account.
        
        Args:
            doctor: Doctor instance
            status: New verification status (VERIFIED or REJECTED)
            notes: Optional verification notes
            verified_by: User who performed the verification
        
        Returns:
            Doctor: Updated doctor instance
        """
        doctor.verification_status = status
        doctor.verification_notes = notes
        doctor.verified_by = verified_by
        doctor.verified_at = timezone.now()

        # Activate or deactivate based on verification status
        if status == VerificationStatus.VERIFIED:
            doctor.is_active = True
            doctor.user.is_active = True
        elif status == VerificationStatus.REJECTED:
            doctor.is_active = False
            doctor.user.is_active = False

        doctor.user.save()
        doctor.save()

        return doctor

    @staticmethod
    def verify_lab(lab, status, notes, verified_by):
        """
        Verify or reject a lab account.
        
        Args:
            lab: Lab instance
            status: New verification status (VERIFIED or REJECTED)
            notes: Optional verification notes
            verified_by: User who performed the verification
        
        Returns:
            Lab: Updated lab instance
        """
        lab.verification_status = status
        lab.verification_notes = notes
        lab.verified_by = verified_by
        lab.verified_at = timezone.now()

        # Activate or deactivate based on verification status
        if status == VerificationStatus.VERIFIED:
            lab.is_active = True
            lab.user.is_active = True
        elif status == VerificationStatus.REJECTED:
            lab.is_active = False
            lab.user.is_active = False

        lab.user.save()
        lab.save()

        return lab

    @staticmethod
    def get_pending_approvals_count():
        """
        Get count of pending approvals for doctors and labs.
        
        Returns:
            dict: Count data with doctors, labs, and total
        """
        pending_doctors = Doctor.objects.filter(
            verification_status=VerificationStatus.PENDING
        ).count()
        pending_labs = Lab.objects.filter(
            verification_status=VerificationStatus.PENDING
        ).count()

        return {
            "doctors": pending_doctors,
            "labs": pending_labs,
            "total": pending_doctors + pending_labs,
        }
