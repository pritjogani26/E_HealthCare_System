import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Dashboard from "./components/Dashboard";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import CheckEmailPage from "./pages/CheckEmailPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import AdminPatientsPage from "./pages/AdminPatientsPage";
import AdminDoctorsPage from "./pages/AdminDoctorsPage";
import AdminLabsPage from "./pages/AdminLabsPage";
import DoctorSchedulePage from "./pages/DoctorSchedulePage";
import BookAppointmentPage from "./pages/BookAppointmentPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import DoctorAppointmentsPage from "./pages/DoctorAppointmentsPage";
import { GoogleOAuthProvider } from "@react-oauth/google";

function App() {
  const googleClientId =
    "91502161974-u4ogi88ovn0bgq7i53ee9aq7tg8lsaen.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
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
              <Route path="/check-email" element={<CheckEmailPage />} />
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
                  <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                    <AdminPatientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/doctors"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN", "STAFF", "PATIENT", "DOCTOR"]}>
                    <AdminDoctorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/labs"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                    <AdminLabsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/schedule"
                element={
                  <ProtectedRoute allowedRoles={["DOCTOR"]}>
                    <DoctorSchedulePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book-appointment"
                element={
                  <ProtectedRoute allowedRoles={["PATIENT"]}>
                    <BookAppointmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-appointments"
                element={
                  <ProtectedRoute allowedRoles={["PATIENT"]}>
                    <MyAppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/appointments"
                element={
                  <ProtectedRoute allowedRoles={["DOCTOR"]}>
                    <DoctorAppointmentsPage />
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
