# users/user_service/email_verify.py
import logging
import uuid
from datetime import timedelta

from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from .db import execute

logger = logging.getLogger(__name__)
from django.utils import timezone
from django.conf import settings


def send_verification_email(user_id: int, email: str) -> bool:
    token = str(uuid.uuid4())
    expires_at = timezone.now() + timedelta(hours=24)
    expires_at_for_db = expires_at.astimezone(timezone.UTC).replace(tzinfo=None)

    logger.debug(
        f"Active EMAIL_BACKEND: {getattr(settings, 'EMAIL_BACKEND', 'unknown')}"
    )

    try:
        execute(
            "SELECT create_email_verification_token(%s,%s,%s)",
            [user_id, token, expires_at_for_db],
        )
        logger.debug("Email verification token stored in DB.")
    except Exception as e:
        logger.exception("Failed to store email verification token in DB.")
        return False

    verify_link = f"{settings.FRONTEND_URL.rstrip('/')}/user/verify-email?token={token}"

    subject = "Verify your email"
    text_content = f"Please verify your email by visiting: {verify_link}\nThis link expires in 24 hours."
    html_content = f"""
    <html>
      <body>
        <p>Hello,</p>
        <p>Please verify your email by clicking the button below:</p>
        <p><a href="{verify_link}" style="display:inline-block;padding:10px 16px;border-radius:6px;text-decoration:none;border:1px solid #2b6cb0">Verify Email</a></p>
        <p>or click below link</p>
        <p><a href="{verify_link}">{verify_link}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not sign up, ignore this message.</p>
      </body>
    </html>
    """

    try:
        msg = EmailMultiAlternatives(
            subject, text_content, settings.DEFAULT_FROM_EMAIL, [email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.debug(f"Verification email sent to {email}")
        return True
    except Exception:
        logger.exception(f"Failed to send verification email to {email}")
        return False
