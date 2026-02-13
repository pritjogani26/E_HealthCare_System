# Hospital_Management/backend/service_app/image_process.py
from django.conf import settings
import os
import uuid
from django.http import HttpRequest


def get_image_path(data, request: HttpRequest, name: str):
    image_path = None
    image = request.FILES.get("profile_image")

    if image:
        folder = os.path.join(settings.MEDIA_ROOT, name)
        os.makedirs(folder, exist_ok=True)

        filename = f"{uuid.uuid4()}_{image.name}".replace(" ", "_")
        filepath = os.path.join(folder, filename)

        with open(filepath, "wb+") as f:
            for chunk in image.chunks():
                f.write(chunk)

        image_path = f"{settings.MEDIA_URL}{name}/{filename}"

    return image_path
