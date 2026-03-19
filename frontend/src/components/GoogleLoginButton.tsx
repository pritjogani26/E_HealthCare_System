import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { googleLogin } from "../services/api";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const GoogleLoginButton: React.FC = () => {
    const navigate = useNavigate();
    const { setAuthUser } = useAuth();
    const toast = useToast();

    const handleSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            try {
                const response = await googleLogin(credentialResponse.credential);

                console.log("Google Login Response:", response);

                if (response.data && response.data.access_token) {
                    console.log("First If : Login Successful!")
                    const perms = response.permissions ?? response.data?.permissions ?? [];
                    setAuthUser(response.data.user, response.data.access_token, perms);
                    toast.success("Login Successful!");
                    navigate('/dashboard');
                }
                else if (response.registered === false) {
                    console.log("Second If : /role-selection'")
                    navigate('/role-selection', { state: { googleData: response } });
                }
                else if (response.access_token) {
                    console.log("Third Else IF Login Successfull....")
                    const perms = response.permissions ?? [];
                    setAuthUser(response.user, response.access_token, perms);
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
