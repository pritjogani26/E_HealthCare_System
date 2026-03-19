# backend/common/middleware/exception_middleware.py

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
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):

        # ── 1. Our own AppException hierarchy ────────────────────────────────
        if isinstance(exception, AppException):
            logger.warning(
                "%s on %s %s: %s",
                type(exception).__name__,
                request.method,
                request.path,
                exception.message,
            )
            return JsonResponse(
                {"success": False, "message": exception.message},
                status=exception.status_code,
            )

        # ── 2. DRF built-in auth exceptions ──────────────────────────────────
        if isinstance(exception, (NotAuthenticated, AuthenticationFailed)):
            logger.warning(
                "Auth failure on %s %s: %s",
                request.method, request.path, str(exception),
            )
            return JsonResponse(
                {"success": False, "message": str(exception.detail)},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if isinstance(exception, PermissionDenied):
            return JsonResponse(
                {"success": False, "message": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if isinstance(exception, DRFValidationError):
            return JsonResponse(
                {"success": False, "message": "Validation failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 3. Database-level errors ──────────────────────────────────────────
        from django.db import DatabaseError, IntegrityError

        if isinstance(exception, IntegrityError):
            msg = str(exception)
            logger.error("IntegrityError on %s %s: %s", request.method, request.path, msg)

            if "EMAIL_ALREADY_EXISTS" in msg:
                return JsonResponse(
                    {"success": False, "message": "An account with this email already exists."},
                    status=status.HTTP_409_CONFLICT,
                )
            if "REGISTRATION_NUMBER_EXISTS" in msg:
                return JsonResponse(
                    {"success": False, "message": "A doctor with this registration number already exists."},
                    status=status.HTTP_409_CONFLICT,
                )
            if "LICENSE_ALREADY_EXISTS" in msg:
                return JsonResponse(
                    {"success": False, "message": "A lab with this license number already exists."},
                    status=status.HTTP_409_CONFLICT,
                )
            return JsonResponse(
                {"success": False, "message": "A data conflict occurred."},
                status=status.HTTP_409_CONFLICT,
            )

        if isinstance(exception, DatabaseError):
            logger.error(
                "DatabaseError on %s %s\n%s",
                request.method, request.path, traceback.format_exc(),
            )
            return JsonResponse(
                {"success": False, "message": "A database error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.exception("Unhandled exception on %s %s", request.method, request.path)
        return JsonResponse(
            {"success": False, "message": "An unexpected error occurred. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )