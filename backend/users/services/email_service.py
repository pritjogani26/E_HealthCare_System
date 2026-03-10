import traceback
from typing import Optional
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import db.email_queries as eq
import db.user_queries as uq


class EmailService:
    @staticmethod
    def send_verification_email(user: dict) -> bool:
        token = eq.create_email_verification_token(
            user_id=user["user_id"], expires_hours=24
        )
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
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
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">E-Healthcare System</h1>
                            <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">Email Verification</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Welcome!</h2>
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                                Thank you for registering. To complete your registration, please verify your email address.
                            </p>
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #059669;">
                                        <a href="{verify_link}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; word-break: break-all; font-size: 12px; color: #374151;">
                                {verify_link}
                            </p>
                            <div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>⚠ Important:</strong> This link expires in 24 hours.</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                                © 2026 E-Healthcare System. All rights reserved.
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
                getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ehealthcare.com"),
                [user["email"]],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            print(f"\nVerification email sent to {user['email']}\n")
            return True
        except Exception as e:
            print(
                "EXCEPTION:",
                traceback.format_exc(),
                f"Failed to send verification email to {user['email']}: {str(e)}",
            )
            return False

    @staticmethod
    def verify_email_token(token: str) -> tuple[bool, Optional[str]]:
        record = eq.get_verification_record(token)
        if not record:
            return False, "Invalid or already used verification token"
        print(f"\n\nRecord : {record}")
        return True, None

    @staticmethod
    def resend_verification_email(email: str) -> tuple[bool, Optional[str]]:
        user = uq.get_user_by_email(email)
        if not user:
            return False, "No account found with this email address"
        if user.get("email_verified"):
            return False, "Email is already verified"
        if EmailService.send_verification_email(user):
            return True, "Verification email has been resent successfully"
        return False, "Failed to send verification email. Please try again later."
