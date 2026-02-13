# Hospital_Management\backend\users\urls.py
from django.urls import path
from .views import (
    ChangePasswordView,
    GoogleLoginView,
    LogoutView,
    ProfileUpdateView,
    RefreshTokenView,
    RegisterUser,
    LoginUser,
    VerifyEmail,
    ProfileView,
)

urlpatterns = [
    path("register/", RegisterUser.as_view(), name="register"),
    path("login/", LoginUser.as_view(), name="login"),
    path("verify-email/", VerifyEmail.as_view(), name="verify-email"),
    path("refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("profile/<int:user_id>/", ProfileView.as_view(), name="profile"),
    path("profile_update/<int:user_id>/", ProfileUpdateView.as_view(), name="profile"),
    path("change_password/<int:user_id>/", ChangePasswordView.as_view(), name="changepassword"),
    path("google-login/", GoogleLoginView.as_view()),
]
