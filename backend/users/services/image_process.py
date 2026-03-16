# backend/users/services/image_process.py

import os
import uuid
import logging

from django.conf import settings
from django.http import HttpRequest

logger = logging.getLogger(__name__)


def get_image_path(
    data,
    request: HttpRequest,
    name: str = "patients",
    image_key: str = "profile_image",
) -> str | None:
    image = request.FILES.get(image_key)
    if not image:
        return None

    try:
        folder = os.path.join(settings.MEDIA_ROOT, name)
        os.makedirs(folder, exist_ok=True)

        filename = f"{uuid.uuid4()}_{image.name}".replace(" ", "_")
        filepath = os.path.join(folder, filename)

        with open(filepath, "wb+") as f:
            for chunk in image.chunks():
                f.write(chunk)

        return f"{settings.MEDIA_URL}{name}/{filename}"

    except Exception:
        logger.exception(
            "Failed to save uploaded image | key=%s | folder=%s", image_key, name
        )
        raise
