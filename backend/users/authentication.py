# backend/users/authentication.py

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from .utils import verify_access_token

User = get_user_model()


class JWTAuthentication(BaseAuthentication):
    """
    Custom JWT Authentication for Django REST Framework
    """
    
    def authenticate(self, request):
        """
        Authenticate request using JWT token from Authorization header
        """
        # Get authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header:
            return None
        
        # Parse header
        try:
            auth_parts = auth_header.split()
            
            if len(auth_parts) != 2:
                raise AuthenticationFailed('Invalid authorization header format')
            
            if auth_parts[0].lower() != 'bearer':
                raise AuthenticationFailed('Authorization header must start with Bearer')
            
            token = auth_parts[1]
        except Exception:
            raise AuthenticationFailed('Invalid authorization header')
        
        # Verify token
        payload = verify_access_token(token)
        
        if payload is None:
            raise AuthenticationFailed('Invalid or expired token')
        
        # Get user
        try:
            user_id = payload.get('user_id')
            user = User.objects.get(user_id=user_id, is_active=True)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found or inactive')
        
        return (user, token)
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the WWW-Authenticate
        header in a 401 Unauthenticated response.
        """
        return 'Bearer realm="api"'