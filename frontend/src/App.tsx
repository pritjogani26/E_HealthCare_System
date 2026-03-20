// frontend/src/App.tsx

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import CheckEmailPage from "./pages/CheckEmailPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPatientsPage from "./pages/AdminPatientsPage";
import AdminDoctorsPage from "./pages/AdminDoctorsPage";
import AdminLabsPage from "./pages/AdminLabsPage";
import DoctorSchedulePage from "./pages/DoctorSchedulePage";
import BookAppointmentPage from "./pages/BookAppointmentPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import DoctorAppointmentsPage from "./pages/DoctorAppointmentsPage";
import SettingsPage from "./pages/SettingsPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import RolePermissionsPage from "./pages/RolePermissionsPage";

// Components
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

// Inactivity modal — imported here, NOT inside AuthContext, to avoid the
// circular import chain (AuthContext → InactivityModal → api.ts) that
// caused AuthProvider to resolve as `undefined` at runtime.
import { InactivityModal } from "./pages/InactivityModel";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuditLogs from "./components/AuditLogs";

const InactivityModalPortal: React.FC = () => {
  const { isInactivityModalVisible, handleInactivityContinue, logout } =
    useAuth();

  if (!isInactivityModalVisible) return null;

  return (
    <InactivityModal onContinue={handleInactivityContinue} onLogout={logout} />
  );
};

// ── App ───────────────────────────────────────────────────────────────────────

const googleClientId =
  "91502161974-u4ogi88ovn0bgq7i53ee9aq7tg8lsaen.apps.googleusercontent.com";

// ADD THIS right before "function App() {"
console.log("COMPONENT CHECK:", {
  HomePage,
  Dashboard,
  LoginPage,
  RegistrationPage,
  VerifyEmailPage,
  CheckEmailPage,
  RoleSelectionPage,
  ProfilePage,
  AdminPatientsPage,
  AdminDoctorsPage,
  AdminLabsPage,
  DoctorSchedulePage,
  BookAppointmentPage,
  MyAppointmentsPage,
  DoctorAppointmentsPage,
  SettingsPage,
  AuthProvider,
  ThemeProvider,
  ProtectedRoute,
  InactivityModal,
  GoogleOAuthProvider,
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <InactivityModalPortal />

              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registration" element={<RegistrationPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/check-email" element={<CheckEmailPage />} />
                <Route path="/role-selection" element={<RoleSelectionPage />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
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
                    <ProtectedRoute>
                      <AdminPatientsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/doctors"
                  element={
                    <ProtectedRoute>
                      <AdminDoctorsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/labs"
                  element={
                    <ProtectedRoute>
                      <AdminLabsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/schedule"
                  element={
                    <ProtectedRoute>
                      <DoctorSchedulePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/book-appointment"
                  element={
                    <ProtectedRoute>
                      <BookAppointmentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-appointments"
                  element={
                    <ProtectedRoute>
                      <MyAppointmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/appointments"
                  element={
                    <ProtectedRoute>
                      <DoctorAppointmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedRoute>
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/role-permissions"
                  element={
                    <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                      <RolePermissionsPage />
                    </ProtectedRoute>
                  }
                />
                {/* Catch-all: 404 */}
                <Route path="*" element={<AccessDeniedPage notFound />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
