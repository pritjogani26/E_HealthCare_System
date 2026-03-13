# common/exceptions.py

from rest_framework import status
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response


class AppException(Exception):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_message = "An unexpected error occurred."
    default_code = "internal_error"

    def __init__(self, message=None, code=None, extra=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        self.extra = extra or {}
        super().__init__(self.message)


class ValidationException(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = "Validation failed."
    default_code = "validation_error"


class NotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_message = "Resource not found."
    default_code = "not_found"


class AuthenticationException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = "Authentication required."
    default_code = "unauthenticated"


class PermissionException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_message = "You do not have permission to perform this action."
    default_code = "forbidden"


class ConflictException(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_message = "A conflict occurred."
    default_code = "conflict"


class ServiceUnavailableException(AppException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_message = "Service temporarily unavailable."
    default_code = "service_unavailable"


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is not None:
        original_data = response.data
        response.data = {
            "success": False,
            "message": _extract_message(original_data),
            "code": _extract_code(original_data),
            "errors": original_data if isinstance(original_data, dict) else {},
        }
    return response


def _extract_message(data):
    if isinstance(data, dict):
        detail = data.get("detail")
        if detail:
            return str(detail)
        return "Validation failed."
    return str(data)


def _extract_code(data):
    if isinstance(data, dict):
        code = data.get("detail", {})
        if hasattr(code, "code"):
            return code.code
    return "error"
