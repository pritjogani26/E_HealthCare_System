# backend\backend\settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get(
    "SECRET_KEY", "django-insecure-vf&omfu)06bm6ri+=p24gyqnlo4-kb8+_)fq3sbgz*)*(r^gc^"
)
DEBUG = True
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "users",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "users.middleware.exception_middleware.ExceptionMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    # "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "backend.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
WSGI_APPLICATION = "backend.wsgi.application"
DATABASES = {
    "default": {
        "ENGINE": os.environ.get("DB_ENGINE", "django.db.backends.postgresql"),
        "NAME": os.environ.get("DB_NAME", "project2"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "admin"),
        # "USER": "app_user",
        # "PASSWORD": "1234",
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "OPTIONS": {
            "connect_timeout": 10,
        },
    }
}
AUTH_USER_MODEL = "auth.User"
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.jwt_auth.PyJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "EXCEPTION_HANDLER": "users.middleware.exceptions.custom_exception_handler",
}
JWT_ACCESS_EXPIRE_MINUTES = int(os.environ.get("JWT_ACCESS_EXPIRE_MINUTES", 15))
JWT_REFRESH_EXPIRE_DAYS = int(os.environ.get("JWT_REFRESH_EXPIRE_DAYS", 7))
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

CORS_ALLOW_ALL_HEADERS = True
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

print(CORS_ALLOWED_ORIGINS)
print(CSRF_TRUSTED_ORIGINS)

CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
LANGUAGE_CODE = "en-us"
TIME_ZONE = os.environ.get("TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
STATIC_ROOT = os.environ.get("STATIC_ROOT", BASE_DIR / "staticfiles")
MEDIA_URL = "/media/"
MEDIA_ROOT = os.environ.get("MEDIA_ROOT", BASE_DIR / "media")
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")


# import os
# from pathlib import Path

# BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY = "your-secret-key-change-this-to-something-random-and-long"

# DEBUG = False

# ALLOWED_HOSTS = ["localhost", "127.0.0.1", "192.168.0.107"]

# INSTALLED_APPS = [
#     "django.contrib.admin",
#     "django.contrib.auth",
#     "django.contrib.contenttypes",
#     "django.contrib.sessions",
#     "django.contrib.messages",
#     "django.contrib.staticfiles",
#     "rest_framework",
#     "corsheaders",
#     "users",
# ]

# MIDDLEWARE = [
#     "django.middleware.security.SecurityMiddleware",
#     "users.middleware.exception_middleware.ExceptionMiddleware",
#     "django.contrib.sessions.middleware.SessionMiddleware",
#     "corsheaders.middleware.CorsMiddleware",
#     "django.middleware.common.CommonMiddleware",
#     "django.middleware.csrf.CsrfViewMiddleware",
#     "django.contrib.auth.middleware.AuthenticationMiddleware",
#     "django.contrib.messages.middleware.MessageMiddleware",
#     "django.middleware.clickjacking.XFrameOptionsMiddleware",
# ]

# ROOT_URLCONF = "backend.urls"

# TEMPLATES = [
#     {
#         "BACKEND": "django.template.backends.django.DjangoTemplates",
#         "DIRS": [],
#         "APP_DIRS": True,
#         "OPTIONS": {
#             "context_processors": [
#                 "django.template.context_processors.debug",
#                 "django.template.context_processors.request",
#                 "django.contrib.auth.context_processors.auth",
#                 "django.contrib.messages.context_processors.messages",
#             ],
#         },
#     },
# ]

# WSGI_APPLICATION = "backend.wsgi.application"

# # ─── Database ────────────────────────────────────────────────────────────────
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": "project2",
#         "USER": "postgres",
#         "PASSWORD": "admin",
#         "HOST": "localhost",
#         "PORT": "5432",
#         "OPTIONS": {
#             "connect_timeout": 10,
#         },
#     }
# }

# AUTH_USER_MODEL = "auth.User"

# AUTH_PASSWORD_VALIDATORS = [
#     {
#         "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
#     },
#     {
#         "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
#         "OPTIONS": {"min_length": 8},
#     },
#     {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
#     {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
# ]

# # ─── Django REST Framework ────────────────────────────────────────────────────
# REST_FRAMEWORK = {
#     "DEFAULT_AUTHENTICATION_CLASSES": [
#         "users.jwt_auth.PyJWTAuthentication",
#     ],
#     "DEFAULT_PERMISSION_CLASSES": [
#         "rest_framework.permissions.IsAuthenticated",
#     ],
#     "DEFAULT_RENDERER_CLASSES": [
#         "rest_framework.renderers.JSONRenderer",
#     ],
#     "EXCEPTION_HANDLER": "users.middleware.exceptions.custom_exception_handler",
# }

# # ─── JWT ─────────────────────────────────────────────────────────────────────
# JWT_ACCESS_EXPIRE_MINUTES = 15
# JWT_REFRESH_EXPIRE_DAYS = 7

# # ─── CORS & CSRF ─────────────────────────────────────────────────────────────
# CORS_ALLOW_CREDENTIALS = True

# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:801",
#     "http://192.168.0.107:801",
# ]
# CSRF_TRUSTED_ORIGINS = [
#     "http://localhost:801",
#     "http://192.168.0.107:801",
# ]

# # ─── Security Cookies ────────────────────────────────────────────────────────
# # Set both to False since we are on HTTP (no SSL/HTTPS locally)
# CSRF_COOKIE_SECURE = False
# SESSION_COOKIE_SECURE = False

# # Comment the line below out — only needed if you're behind HTTPS proxy
# # SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# # ─── Internationalisation ─────────────────────────────────────────────────────
# LANGUAGE_CODE = "en-us"
# TIME_ZONE = "Asia/Kolkata"
# USE_I18N = True
# USE_TZ = True

# # ─── Static & Media ──────────────────────────────────────────────────────────
# STATIC_URL = "/static/"
# STATIC_ROOT = BASE_DIR / "staticfiles"

# MEDIA_URL = "/media/"
# MEDIA_ROOT = BASE_DIR / "media"

# DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# # ─── Email ───────────────────────────────────────────────────────────────────
# EMAIL_BACKEND = os.environ.get(
#     "EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend"
# )
# EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
# EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
# EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
# EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
# EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
# DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)

# # ─── App URLs ────────────────────────────────────────────────────────────────
# FRONTEND_URL = "http://localhost:801"

# # ─── Google OAuth (leave blank if not used) ──────────────────────────────────
# GOOGLE_CLIENT_ID = ""
# GOOGLE_CLIENT_SECRET = ""
