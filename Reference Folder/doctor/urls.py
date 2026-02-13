from django.urls import path
from .views import AddDoctor, DoctorProfile, DoctoreList, GenderList, QualificationList, UpdateDoctor
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("add/", AddDoctor.as_view(), name="add_doctor"),
    path("list/", DoctoreList.as_view(), name="display_doctor"),
    path("profile/<int:doctor_id>",DoctorProfile.as_view(),name="display_doctor_details"),
    path("update/<int:doctor_id>/", UpdateDoctor.as_view(), name="update_doctor"),
    path("genders/", GenderList.as_view(), name="gender_list"),
    path("qualifications/", QualificationList.as_view(), name="qualification_list"),

    # path("delete/<int:patient_id>/", DeleteDoctor.as_view(), name="delete_doctor"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
