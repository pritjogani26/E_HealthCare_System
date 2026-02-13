from django.urls import path
from .views import (
    DeletePatient,
    DisplayPatientDetails,
    UpdatePatient,
    DisplayPatients,
    AddPatient,
)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("add/", AddPatient.as_view(), name="add_patient"),
    path("display/", DisplayPatients.as_view(), name="display_patient"),
    path(
        "display/<int:patient_id>",
        DisplayPatientDetails.as_view(),
        name="display_patient_details",
    ),
    path("update/<int:patient_id>", UpdatePatient.as_view(), name="update_patient"),
    path("delete/<int:patient_id>", DeletePatient.as_view(), name="delete_patient"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
