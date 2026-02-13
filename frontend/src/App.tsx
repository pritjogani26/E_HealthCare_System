// frontend\src\App.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Dashboard from "./components/Dashboard";
import RegistrationPage from "./pages/RegistrationPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import AdminPatientsPage from "./pages/AdminPatientsPage";
import AdminDoctorsPage from "./pages/AdminDoctorsPage";
import AdminLabsPage from "./pages/AdminLabsPage";

function App() {
  return (
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
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;