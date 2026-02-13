import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Layout } from "../components/common/Layout";
import { PageHeader } from "../components/common/PageHeader";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { SecurityCard } from "../components/profile/SecurityCard";
import { ActivityCard } from "../components/profile/ActivityCard";
import { PatientProfileDetails } from "../components/profile/PatientProfileDetails";
import { DoctorProfileDetails } from "../components/profile/DoctorProfileDetails";
import { LabProfileDetails } from "../components/profile/LabProfileDetails";
import { AdminProfileDetails } from "../components/profile/AdminProfileDetails";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { PatientProfile, DoctorProfile, LabProfile, AdminStaffProfile } from "../types";

type AnyProfile = PatientProfile | DoctorProfile | LabProfile | AdminStaffProfile | null;

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<AnyProfile>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, updateUser } = useAuth();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await apiService.getCurrentUserProfile();
        setProfile(data);
        updateUser(data);
      } catch (e) {
        console.error("Failed to load profile", e);
        setError("Unable to load profile details.");
        toast.error("Failed to refresh profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - load profile only once on mount

  const baseUser = (profile as any)?.user ?? profile ?? user;
  const userRole = baseUser?.role;

  return (
    <Layout>
      <PageHeader
        title="My Profile"
        description="View your complete account information and details."
      />

      {loading && <LoadingState message="Loading profile..." />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileHeader user={baseUser} profile={profile} />

            {/* PATIENT Details */}
            {userRole === "PATIENT" && (profile as PatientProfile) && (
              <PatientProfileDetails profile={profile as PatientProfile} />
            )}

            {/* DOCTOR Details */}
            {userRole === "DOCTOR" && (profile as DoctorProfile) && (
              <DoctorProfileDetails profile={profile as DoctorProfile} />
            )}

            {/* LAB Details */}
            {userRole === "LAB" && (profile as LabProfile) && (
              <LabProfileDetails profile={profile as LabProfile} />
            )}

            {/* ADMIN/STAFF Details */}
            {(userRole === "ADMIN" || userRole === "STAFF") && (profile as AdminStaffProfile) && (
              <AdminProfileDetails profile={profile as AdminStaffProfile} />
            )}
          </div>

          {/* Sidebar - Security & Account */}
          <div className="space-y-6">
            <SecurityCard user={baseUser} />
            <ActivityCard user={baseUser} />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfilePage;
