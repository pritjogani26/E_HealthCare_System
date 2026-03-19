// frontend/src/pages/ProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useToast } from "../hooks/useToast";
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
import { getCurrentUserProfile } from "../services/api";
import {
  PatientProfile,
  DoctorProfile,
  LabProfile,
  AdminStaffProfile,
} from "../types";

type AnyProfile =
  | PatientProfile
  | DoctorProfile
  | LabProfile
  | AdminStaffProfile
  | null;

/** Safely extract the role string from any profile shape */
const extractRole = (profile: AnyProfile, fallback?: string): string => {
  if (!profile) return fallback ?? "";
  // AdminStaffProfile has role at top level
  if ("role" in profile && typeof (profile as any).role === "string") {
    return (profile as any).role;
  }
  // Nested profile: { user: { role } }
  if ((profile as any).user?.role) return (profile as any).user.role;

  // Fallback to deriving from IDs
  if ((profile as any).patient_id) return "PATIENT";
  if ((profile as any).doctor_id) return "DOCTOR";
  if ((profile as any).lab_id) return "LAB";

  return fallback ?? "";
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<AnyProfile>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, refreshUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCurrentUserProfile();
        console.log(data)
        if (!cancelled) {
          setProfile(data);
          refreshUser();
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to load profile", e);
          setError("Unable to load profile details. Please try refreshing.");
          toast.error("Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileUpdate = (updated: AnyProfile) => {
    setProfile(updated);
    if (updated) refreshUser();
  };

  // Derive the user object and role for sub-components
  const baseUser = (profile as any)?.user ?? profile ?? user;
  const role = extractRole(
    profile,
    (user as any)?.role ?? (user as any)?.user?.role,
  );

  return (
    <Layout>
      <PageHeader
        title="My Profile"
        description="View and manage your account information."
      />

      {loading && <LoadingState message="Loading profile…" />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column (2/3) ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileHeader user={baseUser} profile={profile} role={role} />

            {role === "PATIENT" && (
              <PatientProfileDetails
                profile={profile as PatientProfile}
                onUpdate={handleProfileUpdate}
              />
            )}

            {role === "DOCTOR" && (
              <DoctorProfileDetails
                profile={profile as DoctorProfile}
                onUpdate={handleProfileUpdate}
              />
            )}

            {(role === "LAB" || role === "LAB_TECHNICIAN") && (
              <LabProfileDetails
                profile={profile as LabProfile}
                onUpdate={handleProfileUpdate}
              />
            )}

            {(role === "ADMIN" || role === "STAFF") && (
              <AdminProfileDetails profile={profile as AdminStaffProfile} />
            )}
          </div>

          {/* ── Right column (1/3) ─────────────────────────────────────────── */}
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
