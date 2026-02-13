import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Dashboard from "./components/Dashboard";
import RegistrationPage from "./pages/RegistrationPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import AdminPatientsPage from "./pages/AdminPatientsPage";
import AdminDoctorsPage from "./pages/AdminDoctorsPage";
import AdminLabsPage from "./pages/AdminLabsPage";
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const googleClientId = "91502161974-u4ogi88ovn0bgq7i53ee9aq7tg8lsaen.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/role-selection" element={<RoleSelectionPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/patients"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <AdminPatientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/doctors"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <AdminDoctorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/labs"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <AdminLabsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
