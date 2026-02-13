# backend/users/utils.py

import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from .models import UserTokens


def generate_access_token(user):
    """
    Generate JWT access token for user
    """
    payload = {
        'user_id': str(user.user_id),
        'email': user.email,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES),
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    
    access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return access_token


def generate_refresh_token(user):
    """
    Generate JWT refresh token and store in database
    """
    payload = {
        'user_id': str(user.user_id),
        'exp': datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    
    refresh_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    
    # Store refresh token in database
    expires_at = timezone.now() + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
    UserTokens.objects.create(
        user=user,
        refresh_token=refresh_token,
        expires_at=expires_at
    )
    
    return refresh_token


def generate_tokens(user):
    """
    Generate both access and refresh tokens
    """
    access_token = generate_access_token(user)
    refresh_token = generate_refresh_token(user)
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': settings.JWT_ACCESS_EXPIRE_MINUTES * 60  # in seconds
    }


def verify_access_token(token):
    """
    Verify and decode access token
    Returns payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Check if token is access token
        if payload.get('type') != 'access':
            return None
        
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def verify_refresh_token(token):
    """
    Verify and decode refresh token
    Returns payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Check if token is refresh token
        if payload.get('type') != 'refresh':
            return None
        
        # Check if token exists in database and is not revoked
        try:
            token_obj = UserTokens.objects.get(
                refresh_token=token,
                is_revoked=False
            )
            return payload
        except UserTokens.DoesNotExist:
            return None
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None