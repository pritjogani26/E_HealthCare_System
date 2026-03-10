from django.urls import path
from .views import (
    LabRegistrationView,
    LabProfileView,
)

app_name = "labs"
urlpatterns = [
    path("register/", LabRegistrationView.as_view(), name="register-lab"),
    path("profile/", LabProfileView.as_view(), name="lab-profile"),
]
