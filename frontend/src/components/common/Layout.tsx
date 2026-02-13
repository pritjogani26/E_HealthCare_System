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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <Toaster position="top-right" />
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
