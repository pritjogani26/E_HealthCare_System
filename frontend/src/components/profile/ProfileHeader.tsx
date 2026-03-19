// frontend/src/components/profile/ProfileHeader.tsx
import React from "react";
import { Mail, Calendar, Clock, User } from "lucide-react";
import { InfoRow } from "../common/InfoRow";

interface ProfileHeaderProps {
  user: any;
  profile: any;
  role?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  profile,
  role: propRole,
}) => {
  // Resolve display name across all profile shapes
  const displayName =
    profile?.full_name ??
    profile?.lab_name ??
    user?.full_name ??
    user?.email ??
    "—";

  // Resolve avatar initials / image
  let profileImage = profile?.profile_image;
  // let profileImage =
  //   profile?.profile_image && !profile.profile_image.includes("/defaults/")
  //     ? profile.profile_image
  //     : profile?.lab_logo && !profile.lab_logo.includes("/defaults/")
  //       ? profile.lab_logo
  //       : null;

  if (profileImage && profileImage.startsWith("/")) {
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
    profileImage = `${baseUrl}${profileImage}`;
    console.log(profileImage);
  }

  const initials = (displayName[0] ?? "U").toUpperCase();

  // Account status & role
  const role = propRole || user?.role_display || user?.role || "—";
  const accountStatus =
    user?.account_status_display ??
    user?.account_status ??
    (user?.is_active === true
      ? "Active"
      : user?.is_active === false
        ? "Inactive"
        : "Active");
  const emailVerified =
    user?.email_verified ?? user?.is_email_verified ?? false;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-md">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {/* Online dot */}
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-slate-900 leading-tight">
            {displayName}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm font-semibold text-emerald-600">
              {role}
            </span>
            {!emailVerified && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium border border-amber-200">
                Email not verified
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                accountStatus === "ACTIVE" || accountStatus === "Active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {accountStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow icon={Mail} label="Email" value={user?.email} />
        <InfoRow icon={User} label="Role" value={role} />
        <InfoRow
          icon={Calendar}
          label="Member Since"
          value={
            user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : null
          }
        />
        <InfoRow
          icon={Clock}
          label="Last Login"
          value={
            user?.last_login_at
              ? new Date(user.last_login_at).toLocaleString()
              : "Never"
          }
        />
      </div>
    </div>
  );
};
