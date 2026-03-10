# backend\patients\urls.py
from django.urls import path
from .views import PatientRegistrationView, PatientProfileView

app_name = "patients"
urlpatterns = [
    path("register/", PatientRegistrationView.as_view(), name="register-patient"),
    path("profile/", PatientProfileView.as_view(), name="patient-profile"),
]
