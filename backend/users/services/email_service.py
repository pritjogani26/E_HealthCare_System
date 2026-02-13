# backend/users/services/email_service.py
import logging
import uuid
from datetime import timedelta
from typing import Optional

from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from ..models import EmailVerificationTable, User

logger = logging.getLogger(__name__)


class EmailService:
    """Service for handling email-related operations"""

    @staticmethod
    def send_verification_email(user: User) -> bool:
        """
        Send verification email to user
        
        Args:
            user: User instance to send verification email to
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        token = str(uuid.uuid4())
        expires_at = timezone.now() + timedelta(hours=24)

        logger.debug(
            f"Active EMAIL_BACKEND: {getattr(settings, 'EMAIL_BACKEND', 'unknown')}"
        )

        # Create email verification token
        try:
            EmailVerificationTable.objects.create(
                user=user,
                token=token,
                expires_at=expires_at,
                is_used=False
            )
            logger.debug("Email verification token stored in DB.")
        except Exception as e:
            logger.exception("Failed to store email verification token in DB.")
            return False

        # Get frontend URL from settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verify_link = f"{frontend_url.rstrip('/')}/verify-email?token={token}"

        subject = "Verify Your Email - E-Healthcare System"
        text_content = f"""
Hello,

Thank you for registering with E-Healthcare System.

Please verify your email by visiting: {verify_link}

This link expires in 24 hours.

If you did not create an account, please ignore this email.

Best regards,
E-Healthcare System Team
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">E-Healthcare System</h1>
                            <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">Email Verification</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Welcome!</h2>
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                                Thank you for registering with E-Healthcare System. To complete your registration, please verify your email address.
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #059669;">
                                        <a href="{verify_link}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; word-break: break-all; font-size: 12px; color: #374151;">
                                {verify_link}
                            </p>
                            
                            <div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
                                    <strong>⚠ Important:</strong> This verification link will expire in 24 hours.
                                </p>
                            </div>
                            
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                If you didn't create this account, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 18px; text-align: center;">
                                © 2026 E-Healthcare System. All rights reserved.
                            </p>
                            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 18px; text-align: center;">
                                This is an automated email. Please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        try:
            msg = EmailMultiAlternatives(
                subject, 
                text_content, 
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@ehealthcare.com'), 
                [user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"Verification email sent to {user.email}")
            return True
        except Exception as e:
            logger.exception(f"Failed to send verification email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def verify_email_token(token: str) -> tuple[bool, Optional[str]]:
        """
        Verify email token and mark email as verified
        
        Args:
            token: Verification token string
            
        Returns:
            tuple: (success: bool, error_message: Optional[str])
        """
        try:
            verification = EmailVerificationTable.objects.get(
                token=token,
                is_used=False
            )
        except EmailVerificationTable.DoesNotExist:
            return False, "Invalid or already used verification token"

        # Check if token has expired
        if verification.expires_at < timezone.now():
            return False, "Verification link has expired. Please request a new one."

        # Mark email as verified
        try:
            user = verification.user
            user.email_verified = True
            user.save(update_fields=['email_verified'])
            
            # Mark token as used
            verification.is_used = True
            verification.save(update_fields=['is_used'])
            
            logger.info(f"Email verified successfully for user: {user.email}")
            return True, None
        except Exception as e:
            logger.exception(f"Error verifying email: {str(e)}")
            return False, "An error occurred while verifying your email"

    @staticmethod
    def resend_verification_email(email: str) -> tuple[bool, Optional[str]]:
        """
        Resend verification email to user
        
        Args:
            email: User email address
            
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return False, "No account found with this email address"

        if user.email_verified:
            return False, "Email is already verified"

        # Delete any existing unused tokens for this user
        EmailVerificationTable.objects.filter(
            user=user,
            is_used=False
        ).delete()

        # Send new verification email
        if EmailService.send_verification_email(user):
            return True, "Verification email has been resent successfully"
        else:
            return False, "Failed to send verification email. Please try again later."
