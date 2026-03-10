import os
import uuid
import logging
from django.conf import settings
from django.http import HttpRequest

logger = logging.getLogger(__name__)


def get_image_path(
    data, request: HttpRequest, name: str = "patients", image_key: str = "profile_image"
):
    try:
        image_path = None
        image = request.FILES.get(image_key)
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
    except Exception:
        logger.exception("Failed to persist uploaded image")
        raise
