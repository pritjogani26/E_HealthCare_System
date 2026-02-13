# backend/users/services/oauth_service.py
import requests
from django.conf import settings
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

class OAuthService:
    GOOGLE_CLIENT_ID = getattr(settings, "GOOGLE_CLIENT_ID", None)
    TOKENINFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo"

    @staticmethod
    def verify_google_token(id_token_str):
        if not id_token_str:
            return None, "Missing id_token"

        idinfo = None
        
        # Method 1: Google Library
        try:
            idinfo = google_id_token.verify_oauth2_token(
                id_token_str, google_requests.Request(), OAuthService.GOOGLE_CLIENT_ID
            )
        except Exception as e:
            print(f"Google Lib Verify Failed: {e}")
            
        # Method 2: TokenInfo Endpoint (Backup)
        if not idinfo:
            try:
                resp = requests.get(
                    OAuthService.TOKENINFO_ENDPOINT, params={"id_token": id_token_str}, timeout=5
                )
                if resp.status_code == 200:
                    data = resp.json()
                    # Verify AUD matches Client ID
                    if OAuthService.GOOGLE_CLIENT_ID and data.get("aud") != OAuthService.GOOGLE_CLIENT_ID:
                        return None, "Invalid client ID"
                    # Verify ISS
                    if data.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
                         return None, "Invalid issuer"
                    idinfo = data
            except Exception as e:
                print(f"TokenInfo Verify Failed: {e}")
                return None, f"Token verification failed: {str(e)}"
                
        if not idinfo:
             return None, "Invalid Google token"

        return idinfo, None
