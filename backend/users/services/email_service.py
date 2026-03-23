# backend/users/services/email_service.py

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from db.audit_queries import insert_auth_audit
from common.exceptions import (
    ValidationException,
    NotFoundException,
    ServiceUnavailableException,
)
import db.email_queries as eq
import db.user_queries as uq

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
        print(f"\n\n\nRecords  : {record}")
        if not record:
            raise ValidationException("Invalid or already used verification token.")
        print(f"\n\n\nRecords  : {record}")

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
