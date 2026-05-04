# backend/users/services/email_service.py

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from users.database_queries.audit_queries import insert_auth_audit
from users.middleware.exceptions import (
    ValidationException,
    NotFoundException,
    ServiceUnavailableException,
)
import users.database_queries.email_queries as eq
import users.database_queries.user_queries as uq

logger = logging.getLogger(__name__)


class EmailService:

    @staticmethod
    def send_verification_email(user: dict) -> bool:
        token = eq.create_email_verification_token(
            user_id=user["user_id"], expires_hours=24
        )
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        verify_link = f"{frontend_url.rstrip('/')}/verify-email?token={token}"
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ehealthcare.com")

        subject = "Verify Your Email - E-Healthcare System"
        text_content = (
            f"Hello,\n\n"
            f"Thank you for registering with E-Healthcare System.\n"
            f"Please verify your email by visiting: {verify_link}\n\n"
            f"This link expires in 24 hours.\n"
            f"\nE-Healthcare System Team"
        )
        html_content = _build_verification_html(verify_link)

        try:
            msg = EmailMultiAlternatives(
                subject, text_content, from_email, [user["email"]]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info("Verification email sent to %s", user["email"])
            return True
        except Exception:
            logger.exception("Failed to send verification email to %s", user["email"])
            return False

    @staticmethod
    def verify_email_token(token: str) -> None:
        record = eq.get_verification_record(token)
        if not record:
            raise ValidationException("Invalid or already used verification token.")
        return record

    @staticmethod
    def resend_verification_email(email: str) -> None:
        user = uq.get_user_by_email(email)
        if not user:
            raise NotFoundException("No account found with this email address.")

        if user.get("email_verified"):
            raise ValidationException("This email address is already verified.")

        sent = EmailService.send_verification_email(user)
        if not sent:
            raise ServiceUnavailableException(
                "Failed to send verification email. Please try again later."
            )

    @staticmethod
    def send_password_reset_email(user: dict) -> bool:
        token = eq.create_password_reset_token(
            user_id=user["user_id"], expires_minutes=60
        )
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        reset_link = f"{frontend_url.rstrip('/')}/reset-password?token={token}"
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ehealthcare.com")

        subject = "Reset Your Password - E-Healthcare System"
        text_content = (
            f"Hello,\n\n"
            f"You requested to reset your password.\n"
            f"Please click the link below to set a new password: {reset_link}\n\n"
            f"This link expires in 60 minutes.\n"
            f"\nE-Healthcare System Team"
        )
        html_content = _build_password_reset_html(reset_link)

        try:
            msg = EmailMultiAlternatives(
                subject, text_content, from_email, [user["email"]]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info("Password reset email sent to %s", user["email"])
            return True
        except Exception:
            logger.exception("Failed to send password reset email to %s", user["email"])
            return False

    @staticmethod
    def check_password_reset_token(token: str) -> bool:
        is_valid = eq.check_password_reset_token_validity(token)
        if not is_valid:
            raise ValidationException("Invalid or expired password reset token.")
        return True

    @staticmethod
    def send_doctor_appointment_confirmation(patient_id: str, appointment: dict) -> bool:
        user = uq.get_user_by_id(patient_id)
        if not user or not user.get("email"):
            return False
            
        subject = "Doctor Appointment Confirmed - E-Healthcare System"
        doctor_name = appointment.get("doctor_name", "your doctor")
        slot_date = appointment.get("slot_date", "")
        start_time = appointment.get("start_time", "")
        end_time = appointment.get("end_time", "")
        
        text_content = (
            f"Hello,\n\n"
            f"Your appointment with {doctor_name} has been confirmed.\n"
            f"Date: {slot_date}\n"
            f"Time: {start_time} to {end_time}\n\n"
            f"Thank you for using E-Healthcare System.\n"
            f"\nE-Healthcare System Team"
        )
        
        try:
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ehealthcare.com")
            msg = EmailMultiAlternatives(subject, text_content, from_email, [user["email"]])
            msg.send(fail_silently=False)
            logger.info("Appointment confirmation email sent to %s", user["email"])
            return True
        except Exception:
            logger.exception("Failed to send appointment email to %s", user.get("email"))
            return False

    @staticmethod
    def send_lab_booking_confirmation(patient_id: str, booking: dict) -> bool:
        user = uq.get_user_by_id(patient_id)
        if not user or not user.get("email"):
            return False
            
        subject = "Lab Test Booking Confirmed - E-Healthcare System"
        date = booking.get("slot_date") or booking.get("booking_date", "")
        
        text_content = (
            f"Hello,\n\n"
            f"Your lab test booking has been confirmed.\n"
            f"Date: {date}\n\n"
            f"Thank you for using E-Healthcare System.\n"
            f"\nE-Healthcare System Team"
        )
        
        try:
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ehealthcare.com")
            msg = EmailMultiAlternatives(subject, text_content, from_email, [user["email"]])
            msg.send(fail_silently=False)
            logger.info("Lab booking confirmation email sent to %s", user["email"])
            return True
        except Exception:
            logger.exception("Failed to send lab booking email to %s", user.get("email"))
            return False

    @staticmethod
    def send_prescription_completed(patient_id: str, prescription: dict) -> bool:
        user = uq.get_user_by_id(patient_id)
        if not user or not user.get("email"):
            return False
            
        subject = "Your Prescription is Ready - E-Healthcare System"
        presc_number = prescription.get("prescription_number", "")
        
        text_content = (
            f"Hello,\n\n"
            f"Your doctor has generated a prescription for your recent appointment.\n"
            f"Prescription Number: {presc_number}\n\n"
            f"You can view and download it from your patient dashboard.\n\n"
            f"Thank you for using E-Healthcare System.\n"
            f"\nE-Healthcare System Team"
        )
        
        try:
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ehealthcare.com")
            msg = EmailMultiAlternatives(subject, text_content, from_email, [user["email"]])
            msg.send(fail_silently=False)
            logger.info("Prescription notification email sent to %s", user["email"])
            return True
        except Exception:
            logger.exception("Failed to send prescription notification to %s", user.get("email"))
            return False

    @staticmethod
    def send_lab_report_completed(patient_id: str, booking: dict) -> bool:
        user = uq.get_user_by_id(patient_id)
        if not user or not user.get("email"):
            return False
            
        subject = "Your Lab Report is Ready - E-Healthcare System"
        
        text_content = (
            f"Hello,\n\n"
            f"Your lab report for your recent lab test is now available.\n"
            f"You can view and download it from your patient dashboard.\n\n"
            f"Thank you for using E-Healthcare System.\n"
            f"\nE-Healthcare System Team"
        )
        
        try:
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ehealthcare.com")
            msg = EmailMultiAlternatives(subject, text_content, from_email, [user["email"]])
            msg.send(fail_silently=False)
            logger.info("Lab report notification email sent to %s", user["email"])
            return True
        except Exception:
            logger.exception("Failed to send lab report notification to %s", user.get("email"))
            return False

    @staticmethod
    def send_doctor_appointment_cancellation(patient_id: str, appointment: dict) -> bool:
        user = uq.get_user_by_id(patient_id)
        if not user or not user.get("email"):
            return False
            
        subject = "Doctor Appointment Cancelled - E-Healthcare System"
        doctor_name = appointment.get("doctor_name", "your doctor")
        slot_date = appointment.get("slot_date", "")
        
        text_content = (
            f"Hello,\n\n"
            f"Your appointment with {doctor_name} on {slot_date} has been cancelled.\n"
            f"If you did not request this cancellation or have any questions, please contact support.\n\n"
            f"Thank you for using E-Healthcare System.\n"
            f"\nE-Healthcare System Team"
        )
        
        try:
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ehealthcare.com")
            msg = EmailMultiAlternatives(subject, text_content, from_email, [user["email"]])
            msg.send(fail_silently=False)
            logger.info("Appointment cancellation email sent to %s", user["email"])
            return True
        except Exception:
            logger.exception("Failed to send appointment cancellation email to %s", user.get("email"))
            return False

    @staticmethod
    def send_lab_booking_cancellation(patient_id: str, booking: dict) -> bool:
        user = uq.get_user_by_id(patient_id)
        if not user or not user.get("email"):
            return False
            
        subject = "Lab Test Booking Cancelled - E-Healthcare System"
        date = booking.get("slot_date") or booking.get("booking_date", "")
        
        text_content = (
            f"Hello,\n\n"
            f"Your lab test booking scheduled for {date} has been cancelled.\n"
            f"If you did not request this cancellation or have any questions, please contact support.\n\n"
            f"Thank you for using E-Healthcare System.\n"
            f"\nE-Healthcare System Team"
        )
        
        try:
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ehealthcare.com")
            msg = EmailMultiAlternatives(subject, text_content, from_email, [user["email"]])
            msg.send(fail_silently=False)
            logger.info("Lab booking cancellation email sent to %s", user["email"])
            return True
        except Exception:
            logger.exception("Failed to send lab booking cancellation email to %s", user.get("email"))
            return False



def _build_verification_html(verify_link: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6;">
    <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
            <td align="center" style="padding:40px 0;">
                <table role="presentation" style="width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding:40px 40px 20px 40px;text-align:center;background:linear-gradient(135deg,#059669 0%,#047857 100%);border-radius:8px 8px 0 0;">
                            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">E-Healthcare System</h1>
                            <p style="margin:10px 0 0 0;color:#d1fae5;font-size:14px;">Email Verification</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="margin:0 0 20px 0;color:#111827;font-size:24px;">Welcome!</h2>
                            <p style="margin:0 0 20px 0;color:#4b5563;font-size:16px;line-height:24px;">
                                please verify your email address.
                            </p>
                            <table role="presentation" style="margin:30px 0;">
                                <tr>
                                    <td style="border-radius:6px;background-color:#059669;">
                                        <a href="{verify_link}" target="_blank"
                                           style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0 0 20px 0;padding:12px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;word-break:break-all;font-size:12px;color:#374151;">
                                {verify_link}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""


def _build_password_reset_html(reset_link: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6;">
    <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
            <td align="center" style="padding:40px 0;">
                <table role="presentation" style="width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding:40px 40px 20px 40px;text-align:center;background:linear-gradient(135deg,#059669 0%,#047857 100%);border-radius:8px 8px 0 0;">
                            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">E-Healthcare System</h1>
                            <p style="margin:10px 0 0 0;color:#d1fae5;font-size:14px;">Password Reset</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="margin:0 0 20px 0;color:#111827;font-size:24px;">Password Reset Request</h2>
                            <p style="margin:0 0 20px 0;color:#4b5563;font-size:16px;line-height:24px;">
                                You recently requested to reset your password. Click the button below to set a new password.
                            </p>
                            <table role="presentation" style="margin:30px 0;">
                                <tr>
                                    <td style="border-radius:6px;background-color:#059669;">
                                        <a href="{reset_link}" target="_blank"
                                           style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0 0 20px 0;color:#4b5563;font-size:14px;line-height:24px;">
                                If you did not request a password reset, please ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""
