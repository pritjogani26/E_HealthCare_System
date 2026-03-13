# common/middleware/exception_middleware.py

import logging
import traceback

from django.http import JsonResponse
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError as DRFValidationError,
)

from common.exceptions import AppException

logger = logging.getLogger(__name__)


class ExceptionMiddleware:
    """
    Catches ALL exceptions raised anywhere in a view and converts them
    to a consistent JSON response shape:

        {
            "success": false,
            "message": "Human-readable message",
            "code":    "machine_readable_code",
            "errors":  {}   ← only present when there are field-level details
        }

    Processing order:
        1. AppException subclasses  → use the exception's own status/code
        2. DRF built-in exceptions  → map to the same shape
        3. Database-level errors    → 500 with a sanitised message
        4. Everything else          → generic 500
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Pass the request through normally.
        # Exceptions from views are caught in process_exception, not here.
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """
        Django calls this method whenever a view raises an unhandled exception.
        Returning a Response here prevents Django's default 500 page.
        """

        # ── 1. Our own AppException hierarchy ────────────────────────────────
        if isinstance(exception, AppException):
            logger.warning(
                "AppException [%s] on %s %s: %s",
                exception.code,
                request.method,
                request.path,
                exception.message,
            )
            body = {
                "success": False,
                "message": exception.message,
                "code": exception.code,
            }
            if exception.extra:
                body["errors"] = exception.extra
            return JsonResponse(body, status=exception.status_code)

        # ── 2. DRF built-in exceptions ────────────────────────────────────────
        if isinstance(exception, (NotAuthenticated, AuthenticationFailed)):
            logger.warning(
                "Auth failure on %s %s: %s",
                request.method, request.path, str(exception)
            )
            return JsonResponse(
                {
                    "success": False,
                    "message": str(exception.detail),
                    "code": "unauthenticated",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if isinstance(exception, PermissionDenied):
            return JsonResponse(
                {
                    "success": False,
                    "message": "You do not have permission to perform this action.",
                    "code": "forbidden",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if isinstance(exception, DRFValidationError):
            return JsonResponse(
                {
                    "success": False,
                    "message": "Validation failed.",
                    "code": "validation_error",
                    "errors": exception.detail,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 3. Database-level errors ──────────────────────────────────────────
        from django.db import DatabaseError, IntegrityError

        if isinstance(exception, IntegrityError):
            logger.error(
                "IntegrityError on %s %s: %s",
                request.method, request.path, str(exception)
            )
            # Parse PostgreSQL raised exceptions you control (e.g. "EMAIL_ALREADY_EXISTS")
            msg = str(exception)
            if "EMAIL_ALREADY_EXISTS" in msg:
                return JsonResponse(
                    {"success": False, "message": "An account with this email already exists.", "code": "email_conflict"},
                    status=status.HTTP_409_CONFLICT,
                )
            if "REGISTRATION_NUMBER_EXISTS" in msg:
                return JsonResponse(
                    {"success": False, "message": "A doctor with this registration number already exists.", "code": "reg_conflict"},
                    status=status.HTTP_409_CONFLICT,
                )
            if "LICENSE_ALREADY_EXISTS" in msg:
                return JsonResponse(
                    {"success": False, "message": "A lab with this license number already exists.", "code": "license_conflict"},
                    status=status.HTTP_409_CONFLICT,
                )
            return JsonResponse(
                {"success": False, "message": "A data conflict occurred.", "code": "conflict"},
                status=status.HTTP_409_CONFLICT,
            )

        if isinstance(exception, DatabaseError):
            logger.error(
                "DatabaseError on %s %s\n%s",
                request.method, request.path, traceback.format_exc()
            )
            return JsonResponse(
                {"success": False, "message": "A database error occurred. Please try again.", "code": "database_error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── 4. Completely unexpected exceptions ───────────────────────────────
        logger.exception(
            "Unhandled exception on %s %s",
            request.method,
            request.path,
        )
        return JsonResponse(
            {
                "success": False,
                "message": "An unexpected error occurred. Please try again.",
                "code": "internal_error",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )