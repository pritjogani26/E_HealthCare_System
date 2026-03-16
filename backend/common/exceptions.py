# backend/common/exceptions.py

from rest_framework import status


class AppException(Exception):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_message = "An unexpected error occurred."

    def __init__(self, message=None):
        self.message = message or self.default_message
        super().__init__(self.message)



class ValidationException(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = "Validation failed."


class AuthenticationException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = "Authentication required."


class TokenExpiredException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = "Your session has expired. Please log in again."


class PermissionException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_message = "You do not have permission to perform this action."


class NotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_message = "Resource not found."


class ConflictException(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_message = "A conflict occurred."


class UnprocessableEntityException(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_message = "The request could not be processed."


class RateLimitException(AppException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_message = "Too many requests. Please try again later."




class ServiceUnavailableException(AppException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_message = "Service temporarily unavailable. Please try again later."




def custom_exception_handler(exc, context):
    from rest_framework.views import exception_handler as drf_exception_handler

    if isinstance(exc, AppException):
        return None

    response = drf_exception_handler(exc, context)

    if response is not None:
        response.data = {
            "success": False,
            "message": _extract_message(response.data),
        }

    return response


def _extract_message(data: dict | str) -> str:
    if isinstance(data, dict):
        detail = data.get("detail")
        if detail:
            return str(detail)
        for value in data.values():
            if isinstance(value, list) and value:
                return str(value[0])
    return str(data)
