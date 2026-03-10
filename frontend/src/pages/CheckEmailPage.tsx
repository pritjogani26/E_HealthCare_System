import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Mail } from "lucide-react";

const CheckEmailPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || "your email address";

    useEffect(() => {
        // Automatically redirect to login page after 15 seconds
        const timer = setTimeout(() => {
            navigate('/login');
        }, 15000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header, like the image has a header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-transparent">
                {/* You mentioned upwork style, keeping it simple as a brand text if needed, but not required */}
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-4 pb-20">
                <div className="max-w-md w-fulltext-center space-y-[24px] flex flex-col items-center">

                    {/* Icon Envelope */}
                    <div className="relative mb-4">
                        {/* The image shows a grey envelope with a pink badge */}
                        <div className="w-[120px] h-[100px] relative mt-8 mb-4">
                            {/* Just a symbolic envelope using SVG */}
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[120px] h-[90px] text-slate-200" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 8L12 14L21 8M3 16V8C3 6.89543 3.89543 6 5 6H19C20.1046 6 21 6.89543 21 8V16C21 17.1046 20.1046 18 19 18H5C3.89543 18 3 17.1046 3 16Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                            </svg>
                            {/* Pink Circle Notification */}
                            <div className="absolute top-0 right-0 w-8 h-8 bg-pink-500 rounded-full border-4 border-white translate-x-1 -translate-y-1"></div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight">
                        Verify your email to continue
                    </h2>

                    <div className="text-slate-600 text-sm md:text-base leading-relaxed text-center px-4 max-w-sm mt-3">
                        <p>We just sent an email to the address: <span className="text-slate-900">{email}</span></p>
                        <p>Please check your email and select the link provided to verify your address.</p>
                    </div>

                    <div className="flex flex-row items-center justify-center gap-4 mt-8 w-full">
                        <button
                            onClick={() => { /* no-op for now */ }}
                            className="px-6 py-2 border border-green-700 text-green-700 font-medium rounded-md hover:bg-green-50 transition-colors"
                        >
                            Send again
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 bg-green-700 text-white font-medium rounded-md hover:bg-green-800 transition-colors"
                        >
                            Go to Login Page
                        </button>
                    </div>

                    <div className="mt-8 pt-4">
                        <a
                            href="#"
                            className="text-green-700 hover:text-green-800 font-medium hover:underline text-sm"
                            onClick={(e) => e.preventDefault()}
                        >
                            Didn't receive email?
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckEmailPage;
