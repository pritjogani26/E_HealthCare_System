from datetime import datetime
import json
from django.http import JsonResponse, HttpRequest
from django.utils.deprecation import MiddlewareMixin
from rest_framework import status
from users.user_service.jwt_utils import decode_token
from rest_framework.exceptions import AuthenticationFailed


class RequestValidationMiddvleware(MiddlewareMixin):

    ALLOWED_CONTENT_TYPES = [
        "application/json",
        "multipart/form-data",
        "application/x-www-form-urlencoded",
    ]

    SKIP_PATHS = [
        "/user/login/",
        "/user/refresh/",
        "/user/register/",
        "/user/logout/",
        "/user/verify-email/",
        "/user/google-login/",
    ]

    PROTECTED_PATHS = ("/profile/", "/change_password/", "/profile_update/")

    def process_request(self, request: HttpRequest):

        try:
            # Skip middleware for static/media/admin and similar paths
            if any(request.path.startswith(p) for p in self.SKIP_PATHS):
                return None

            if request.method in ("POST", "PUT", "PATCH"):
                content_type = request.content_type or ""
                if not content_type.startswith(self.ALLOWED_CONTENT_TYPES):
                    return JsonResponse(
                        {"error": "Unsupported Content-Type"},
                        status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    )

            if self._is_protected_path(request.path):
                print("\n Passes from PROTECTED_PATHS")
                auth_header = request.headers.get("Authorization")

                if not auth_header:
                    return JsonResponse(
                        {"error": "Authorization header missing"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )

                parts = auth_header.split()
                if len(parts) != 2 or parts[0].lower() != "bearer":
                    return JsonResponse(
                        {"error": "Invalid Authorization header format"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )

                token = parts[1]

                try:
                    user_id = decode_token(token)
                except AuthenticationFailed:
                    return JsonResponse(
                        {"error": "Token expired"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
                except Exception:
                    return JsonResponse(
                        {"error": "Invalid token"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )

                request.user_id = user_id
                request.token = token

            path = request.path.lower()
            parts = path.strip("/").split("/")

            print(f"\n\nPath: {path}")

            if parts[-1] == "register" and request.method == "POST":
                print("Your are trying to Register.")
                data = self._get_request_data(request)

                if data is None:
                    return JsonResponse(
                        {"error": "Invalid request body"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                request._validated_payload = data

            return None

        except Exception as e:
            self._log_error(request, e)
            return JsonResponse(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _get_request_data(self, request: HttpRequest):
        content_type = request.content_type or ""
        if content_type.startswith("application/json"):
            try:
                return json.loads(request.body.decode("utf-8"))
            except Exception:
                return None

        return request.POST

    def _is_protected_path(self, path: str) -> bool:
        path = path.lower()
        return any(p in path for p in self.PROTECTED_PATHS)

    def _log_error(self, request: HttpRequest, error: Exception):
        with open("users_middleware_errors", "a") as file:
            file.write(
                f"\n\n{datetime.now()} | Middleware Error: {str(error)} | "
                f"{request.method} {request.path}"
            )


# # Hospital_Management/backend/users/middleware.py

# import json
# import logging
# import traceback
# from datetime import datetime
# from pathlib import Path
# from typing import Optional, Dict, Any

# from django.http import JsonResponse, HttpRequest, HttpResponse
# from django.utils.deprecation import MiddlewareMixin
# from django.conf import settings
# from rest_framework import status
# from rest_framework.exceptions import AuthenticationFailed

# from .user_service.jwt_utils import decode_token

# logger = logging.getLogger(__name__)


# class RequestValidationMiddleware(MiddlewareMixin):
#     """
#     Middleware for request validation and authentication:
#     - Validates content types for POST/PUT/PATCH requests
#     - Enforces authentication for protected endpoints
#     - Attaches user information to request for authenticated users
#     - Skips processing for exempt paths (admin, static, media, public endpoints)
#     - Logs all errors to a text file
#     """

#     # Content types allowed for POST/PUT/PATCH requests
#     ALLOWED_CONTENT_TYPES = [
#         "application/json",
#         "multipart/form-data",
#         "application/x-www-form-urlencoded",
#     ]

#     # Paths that should skip middleware processing entirely
#     EXEMPT_PREFIXES = (
#         "/admin/",
#         "/static/",
#         "/media/",
#         "/favicon.ico",
#     )

#     # Public endpoints that don't require authentication
#     PUBLIC_PATHS = (
#         "/user/register/",
#         "/user/login/",
#         "/user/refresh/",
#         "/user/logout/",
#         "/user/verify-email/",
#     )

#     # Path patterns that require authentication
#     PROTECTED_PATH_PATTERNS = (
#         "/user/profile/",
#         "/user/change_password/",
#     )

#     def __init__(self, get_response):
#         super().__init__(get_response)
#         # Set error log file path (in backend directory)
#         self.error_log_file = Path(settings.BASE_DIR) / "users_middleware_errors.txt"

#     def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
#         """
#         Process incoming request:
#         1. Skip exempt paths (admin, static, media)
#         2. Allow OPTIONS requests for CORS preflight
#         3. Validate content type for POST/PUT/PATCH
#         4. Enforce authentication for protected paths
#         5. Attach user info to request if authenticated
#         """
#         path = request.path

#         # Skip exempt paths
#         if self._is_exempt(path):
#             return None

#         # Allow CORS preflight requests
#         if request.method == "OPTIONS":
#             return None

#         try:
#             # Validate content type for requests with body
#             if request.method in ("POST", "PUT", "PATCH"):
#                 if not self._is_valid_content_type(request):
#                     error_msg = "Unsupported Content-Type. Allowed types: application/json, multipart/form-data, application/x-www-form-urlencoded"
#                     self._append_error_to_file(
#                         request=request,
#                         error_type="Content-Type Validation Error",
#                         error_message=error_msg,
#                         status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
#                     )
#                     return JsonResponse(
#                         {"error": error_msg},
#                         status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
#                     )

#             # Check if path requires authentication
#             if self._is_protected_path(path):
#                 auth_result = self._validate_authentication(request)
#                 if isinstance(auth_result, JsonResponse):
#                     return auth_result
#                 # Authentication successful, user_id and token attached to request

#             return None

#         except Exception as e:
#             error_traceback = traceback.format_exc()
#             logger.exception(
#                 "Unexpected error in RequestValidationMiddleware: %s for %s %s",
#                 str(e),
#                 request.method,
#                 path,
#             )
#             self._append_error_to_file(
#                 request=request,
#                 error_type="Unexpected Exception",
#                 error_message=str(e),
#                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 traceback_str=error_traceback,
#             )
#             return JsonResponse(
#                 {"error": "Internal server error"},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             )

#     def _is_exempt(self, path: str) -> bool:
#         """Check if path should be exempt from middleware processing."""
#         return any(path.startswith(prefix) for prefix in self.EXEMPT_PREFIXES)

#     def _is_public_path(self, path: str) -> bool:
#         """Check if path is a public endpoint that doesn't require auth."""
#         return any(path.startswith(public_path) for public_path in self.PUBLIC_PATHS)

#     def _is_protected_path(self, path: str) -> bool:
#         """Check if path requires authentication."""
#         # Don't protect public paths
#         if self._is_public_path(path):
#             return False

#         # Check if path matches protected patterns
#         path_lower = path.lower()
#         return any(pattern in path_lower for pattern in self.PROTECTED_PATH_PATTERNS)

#     def _is_valid_content_type(self, request: HttpRequest) -> bool:
#         """Validate that request has an allowed content type."""
#         content_type = (request.content_type or "").lower()

#         # Empty content type is allowed (some requests might not have body)
#         if not content_type:
#             return True

#         # Check if content type starts with any allowed type
#         return any(
#             content_type.startswith(allowed_type.lower())
#             for allowed_type in self.ALLOWED_CONTENT_TYPES
#         )

#     def _validate_authentication(self, request: HttpRequest) -> Optional[JsonResponse]:
#         """
#         Validate JWT token from Authorization header.
#         On success, attaches user_id and token to request.
#         Returns JsonResponse with error if validation fails.
#         """
#         auth_header = request.headers.get("Authorization") or request.META.get(
#             "HTTP_AUTHORIZATION"
#         )

#         if not auth_header:
#             error_msg = "Authentication required but missing Authorization header"
#             logger.warning(
#                 "%s for %s %s",
#                 error_msg,
#                 request.method,
#                 request.path,
#             )
#             self._append_error_to_file(
#                 request=request,
#                 error_type="Authentication Error",
#                 error_message=error_msg,
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#             )
#             return JsonResponse(
#                 {"error": "Authentication required. Please provide a valid token."},
#                 status=status.HTTP_401_UNAUTHORIZED,
#             )

#         # Parse Authorization header
#         parts = auth_header.split()
#         if len(parts) != 2 or parts[0].lower() != "bearer":
#             error_msg = "Invalid Authorization header format"
#             logger.warning(
#                 "%s for %s %s",
#                 error_msg,
#                 request.method,
#                 request.path,
#             )
#             self._append_error_to_file(
#                 request=request,
#                 error_type="Authentication Error",
#                 error_message=f"{error_msg}. Received format: {auth_header[:20]}...",
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#             )
#             return JsonResponse(
#                 {
#                     "error": "Invalid Authorization header format. Expected: Bearer <token>"
#                 },
#                 status=status.HTTP_401_UNAUTHORIZED,
#             )

#         token = parts[1]

#         # Decode and validate token
#         try:
#             user_id = decode_token(token)
#         except AuthenticationFailed as exc:
#             error_msg = f"Token validation failed: {str(exc)}"
#             logger.warning(
#                 "Authentication failed for %s %s: %s",
#                 request.method,
#                 request.path,
#                 str(exc),
#             )
#             self._append_error_to_file(
#                 request=request,
#                 error_type="Authentication Error",
#                 error_message=error_msg,
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#             )
#             return JsonResponse(
#                 {"error": str(exc)},
#                 status=status.HTTP_401_UNAUTHORIZED,
#             )
#         except Exception as exc:
#             error_traceback = traceback.format_exc()
#             error_msg = f"Unexpected error during token validation: {str(exc)}"
#             logger.error(
#                 "Unexpected error during token validation for %s %s: %s",
#                 request.method,
#                 request.path,
#                 str(exc),
#                 exc_info=True,
#             )
#             self._append_error_to_file(
#                 request=request,
#                 error_type="Token Validation Exception",
#                 error_message=error_msg,
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 traceback_str=error_traceback,
#             )
#             return JsonResponse(
#                 {"error": "Invalid or malformed token"},
#                 status=status.HTTP_401_UNAUTHORIZED,
#             )

#         # Attach user information to request
#         self._attach_user_to_request(request, user_id, token)
#         return None

#     def _attach_user_to_request(
#         self, request: HttpRequest, user_id: int, token: str
#     ) -> None:
#         """Attach user information to request object for use in views."""
#         request.user_id = user_id
#         request.token = token

#         # Create a simple user object for compatibility
#         class _UserObj:
#             def __init__(self, user_id: int):
#                 self.user_id = user_id
#                 self.id = user_id
#                 self.is_authenticated = True
#                 self.is_anonymous = False

#             def get_username(self) -> str:
#                 return str(self.user_id)

#         request.user_obj = _UserObj(user_id)

#     def _append_error_to_file(
#         self,
#         request: HttpRequest,
#         error_type: str,
#         error_message: str,
#         status_code: int,
#         traceback_str: Optional[str] = None,
#     ) -> None:
#         """
#         Append error information to the error log file.
#         Includes timestamp, request details, error type, message, and optional traceback.
#         """
#         try:
#             timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#             ip_address = request.META.get("REMOTE_ADDR", "Unknown")
#             user_agent = request.META.get("HTTP_USER_AGENT", "Unknown")

#             error_entry = f"""
# {'='*80}
# [{timestamp}] {error_type}
# {'='*80}
# Method: {request.method}
# Path: {request.path}
# IP Address: {ip_address}
# User Agent: {user_agent}
# Status Code: {status_code}
# Error Message: {error_message}
# """

#             if traceback_str:
#                 error_entry += f"\nTraceback:\n{traceback_str}\n"

#             error_entry += f"{'='*80}\n\n"

#             # Append to file
#             with open(self.error_log_file, "a", encoding="utf-8") as f:
#                 f.write(error_entry)

#         except Exception as e:
#             # If we can't write to the error file, log it to the logger
#             logger.error(
#                 "Failed to write error to file: %s. Original error: %s",
#                 str(e),
#                 error_message,
#             )

#     def process_response(
#         self, request: HttpRequest, response: HttpResponse
#     ) -> HttpResponse:
#         """Add custom headers to response and log error responses."""
#         try:
#             response["X-Processed-By"] = "RequestValidationMiddleware"
#             if hasattr(request, "user_id"):
#                 response["X-User-Id"] = str(request.user_id)
#         except Exception:
#             # Ignore errors when setting headers
#             pass

#         # Log error responses (4xx and 5xx status codes)
#         if hasattr(response, "status_code"):
#             status_code = response.status_code
#             if status_code >= 400:  # Client errors (4xx) and server errors (5xx)
#                 self._log_error_response(request, response, status_code)

#         return response

#     def _log_error_response(
#         self, request: HttpRequest, response: HttpResponse, status_code: int
#     ) -> None:
#         """Log error responses to the error file."""
#         try:
#             # Extract error message from response if possible
#             error_message = "Unknown error"
#             if hasattr(response, "data") and isinstance(response.data, dict):
#                 error_message = response.data.get("error", response.data.get("detail", str(response.data)))
#             elif hasattr(response, "content"):
#                 try:
#                     content_str = response.content.decode("utf-8")
#                     if content_str:
#                         # Try to parse as JSON
#                         try:
#                             error_data = json.loads(content_str)
#                             error_message = error_data.get("error", error_data.get("detail", content_str))
#                         except (json.JSONDecodeError, AttributeError):
#                             error_message = content_str[:500]  # Limit length
#                 except (UnicodeDecodeError, AttributeError):
#                     error_message = "Unable to decode response content"

#             # Determine error type based on status code
#             if status_code >= 500:
#                 error_type = "Server Error (5xx)"
#             elif status_code == 401:
#                 error_type = "Unauthorized Error (401)"
#             elif status_code == 403:
#                 error_type = "Forbidden Error (403)"
#             elif status_code == 404:
#                 error_type = "Not Found Error (404)"
#             elif status_code == 400:
#                 error_type = "Bad Request Error (400)"
#             else:
#                 error_type = f"Client Error ({status_code})"

#             self._append_error_to_file(
#                 request=request,
#                 error_type=error_type,
#                 error_message=f"Response error: {error_message}",
#                 status_code=status_code,
#             )

#         except Exception as e:
#             # If logging fails, use the logger as fallback
#             logger.error(
#                 "Failed to log error response: %s for %s %s",
#                 str(e),
#                 request.method,
#                 request.path,
#             )
