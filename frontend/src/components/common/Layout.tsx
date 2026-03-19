// frontend/src/components/common/Layout.tsx
import React, { useState } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import Footer from "../Footer";
import { Toaster } from "react-hot-toast";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#e8f0f7" }}>
            {/* ── Global Toast Container ────────────────────────────────────── */}
            <Toaster
                position="top-right"
                gutter={10}
                containerStyle={{ top: 72, right: 20 }}
                toastOptions={{
                    duration: 4000,
                    style: {
                        fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        borderRadius: "12px",
                        boxShadow:
                            "0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.08)",
                        padding: "12px 16px",
                        maxWidth: "380px",
                        animation: "slideInRight 0.25s ease-out",
                    },
                    success: {
                        style: {
                            background: "#f0fdf4",
                            color: "#166534",
                            border: "1px solid #bbf7d0",
                        },
                        iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
                    },
                    error: {
                        duration: 5000,
                        style: {
                            background: "#fff1f2",
                            color: "#9f1239",
                            border: "1px solid #fecdd3",
                        },
                        iconTheme: { primary: "#e11d48", secondary: "#fff1f2" },
                    },
                    loading: {
                        style: {
                            background: "#e8f0f7",
                            color: "#1a3c6e",
                            border: "1px solid #d0dff0",
                        },
                    },
                }}
            />

            <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="lg:pl-72">
                <Header setIsSidebarOpen={setIsSidebarOpen} />
                <main className="p-6 min-h-[calc(100vh-73px)] flex flex-col">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};