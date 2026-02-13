import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GoogleLoginButton: React.FC = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuth();

    const handleSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            try {
                const response = await apiService.googleLogin(credentialResponse.credential);

                console.log("Google Login Response:", response);

                // Check if response contains nested data (common for successful API responses)
                if (response.data && response.data.access_token) {
                    setAuth(response.data.user, response.data.access_token);
                    toast.success("Login Successful!");
                    navigate('/dashboard');
                }
                // Check if response indicates unregistered user (custom structure)
                else if (response.registered === false) {
                    navigate('/role-selection', { state: { googleData: response } });
                }
                // Fallback check
                else if (response.access_token) {
                    setAuth(response.user, response.access_token);
                    toast.success("Login Successful!");
                    navigate('/dashboard');
                }
                else {
                    console.error("Unexpected response structure:", response);
                    toast.error("Login failed: Unexpected server response");
                }
            } catch (error: any) {
                console.error("Google Login Error:", error);
                toast.error(error.response?.data?.message || "Google login failed");
            }
        }
    };

    return (
        <div className="w-full flex justify-center mt-4">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => toast.error("Google Login Failed")}
                useOneTap
                theme="outline"
                size="large"
                shape="rectangular"
                width="100%"
            />
        </div>
    );
};

export default GoogleLoginButton;
