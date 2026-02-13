# Hospital_Management\backend\users\views.py
from django.http import HttpRequest
from rest_framework import generics, status
from rest_framework.response import Response
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from users.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny

from .serializers import (
    ChangePasswordSerializer,
    ProfileSerializer,
    RegisterSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
)
from service_app.image_process import get_image_path
from .user_service.register_service import register
from .user_service.login_service import login
from .user_service.profile_service import fetch_user_profile
from .user_service.db import execute, fetch_one
from .user_service.refresh_token_service import refresh_token_service
from .user_service.verify_email_service import verify_email_service
from .user_service.change_password_service import change_password_service


COOKIE_NAME = "refresh_token"
REFRESH_DAYS = 7
ACCESS_EXPIRE_MINUTES = 15


class RegisterUser(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest):
        print("\n\nView\n")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        image_path = get_image_path(data, request, name="users")
        res: Response = register(data, image_path)
        print(res)
        return res


class LoginUser(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = login(data)
        if result.get("status") != "ok":
            return Response(
                {"error": result.get("error")}, status=status.HTTP_400_BAD_REQUEST
            )

        access = result["access_token"]
        refresh = result["refresh_token"]
        user = result["user"]

        print(f"\n\nAccess : {access}")
        print(f"\nRefresh : {refresh}")
        print(f"\nUser    : {user}")

        resp: Response = Response(
            {
                "access_token": access,
                "user": user,
            },
            status=status.HTTP_200_OK,
        )
        max_age = REFRESH_DAYS * 24 * 60 * 60
        secure_flag = False
        resp.set_cookie(
            COOKIE_NAME,
            refresh,
            httponly=True,
            secure=secure_flag,
            samesite="Lax",
            max_age=max_age,
        )
        return resp


@method_decorator(csrf_exempt, name="dispatch")
class RefreshTokenView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest):
        print("\n Refresh Token Regenerate is start.\n\n")
        resp: Response = refresh_token_service(self, request)
        return resp


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest):
        refresh_token = request.COOKIES.get(COOKIE_NAME)
        if refresh_token:
            try:
                execute("select revoke_token(%s)", [refresh_token])
            except Exception:
                pass

        resp: Response = Response({"message": "Logged out"}, status=status.HTTP_200_OK)
        resp.delete_cookie(COOKIE_NAME)
        return resp


class VerifyEmail(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def put(self, request: HttpRequest):
        print("\nReached")
        res: Response = verify_email_service(self, request)
        return res


class ProfileView(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return []

    serializer_class = ProfileSerializer

    def get(self, request: HttpRequest, user_id: int):
        print("\n\nReached")
        res: Response = fetch_user_profile(self, user_id)
        print(res)
        return res


from rest_framework.parsers import MultiPartParser, FormParser


class ProfileUpdateView(generics.GenericAPIView):
    serializer_class = ProfileUpdateSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request: HttpRequest, user_id: int):
        if request.user.user_id != user_id:
            return Response(
                {"error": "You are not allowed to update this profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        image_path = get_image_path(data, request, name="users")

        res = fetch_one(
            "select * from update_profile(%s, %s, %s, %s, %s)",
            [
                user_id,
                data.get("first_name"),
                data.get("last_name"),
                data.get("mobile"),
                image_path,
            ],
        )

        if not res or res.get("update_profile") != 1:
            return Response(
                {"error": "Unexpected error while updating profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Profile updated successfully"},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, user_id: int):
        if not user_id:
            return Response(
                {"error": "You are not allowed to change this password"},
                status=status.HTTP_403_FORBIDDEN,
            )

        res: Response = change_password_service(self, request, user_id)
        return res


@method_decorator(csrf_exempt, name="dispatch")
class GoogleLoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest):
        print("\n\nReached in View...Done")
        id_token_str = request.data.get("id_token")
        print(f"id_token_str: {id_token_str}\nDone")

        if not id_token_str:
            return Response(
                {"error": "Google token missing"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .user_service.oauth_service import google_login

        result = google_login(id_token_str)
        print(f"result : {result}")
        if result["status"] != "ok":
            return Response(
                {"error": result["error"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resp = Response(
            {
                "access_token": result["access_token"],
                "user": result["user"],
            },
            status=status.HTTP_200_OK,
        )

        resp.set_cookie(
            COOKIE_NAME,
            result["refresh_token"],
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            max_age=REFRESH_DAYS * 24 * 60 * 60,
        )
        return resp
