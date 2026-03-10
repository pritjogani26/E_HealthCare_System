from django.urls import path
from .views import (
    DoctorRegistrationView,
    DoctorProfileView,
    DoctorListView,
    DoctorDetailView,
    AvailableSlotsView,
    GenerateSlotsView,
    BookAppointmentView,
    MyAppointmentsView,
    CancelAppointmentView,
)

app_name = "doctors"
urlpatterns = [
    path("register/", DoctorRegistrationView.as_view(), name="register-doctor"),
    path("profile/", DoctorProfileView.as_view(), name="doctor-profile"),
    path("list/", DoctorListView.as_view(), name="doctor-list"),
    path("<uuid:user_id>/", DoctorDetailView.as_view(), name="doctor-detail"),
    path("<uuid:user_id>/slots/", AvailableSlotsView.as_view(), name="doctor-slots"),
    path("slots/generate/", GenerateSlotsView.as_view(), name="generate-slots"),
    path("appointments/book/", BookAppointmentView.as_view(), name="book-appointment"),
    path("appointments/my/", MyAppointmentsView.as_view(), name="my-appointments"),
    path(
        "appointments/<int:appointment_id>/cancel/",
        CancelAppointmentView.as_view(),
        name="cancel-appointment",
    ),
]