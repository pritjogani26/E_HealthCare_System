# backend/users/helpers/auth_helpers.py

from django.conf import settings
from ..utils import generate_tokens


def set_auth_response_with_tokens(user, user_data, message):
    """
    Helper function to create a response with tokens.
    - Access token: returned in response body
    - Refresh token: set in HttpOnly cookie
    
    Returns a tuple: (response_dict, refresh_token)
    The caller should set the cookie on the Response object.
    """
    tokens = generate_tokens(user)
    
    response_dict = {
        'success': True,
        'message': message,
        'data': {
            'user': user_data,
            'access_token': tokens['access_token']
        }
    }
    
    return response_dict, tokens['refresh_token']


def set_refresh_token_cookie(response, refresh_token):
    """
    Set refresh token as HttpOnly cookie on response.
    
    Args:
        response: Django Response object
        refresh_token: The refresh token string
    
    Returns:
        Response object with cookie set
    """
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        max_age=settings.JWT_REFRESH_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax'
    )
    return response
