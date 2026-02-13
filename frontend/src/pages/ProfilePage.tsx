import React, { useEffect, useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Award,
  Building2,
  Clock,
  FileText,
  Heart,
  Stethoscope,
  Activity
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { PatientProfile, DoctorProfile, LabProfile, AdminStaffProfile } from "../types";

type AnyProfile = PatientProfile | DoctorProfile | LabProfile | AdminStaffProfile | null;

const ProfilePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - load profile only once on mount

  const baseUser = (profile as any)?.user ?? profile ?? user;
  const userRole = baseUser?.role;

  // Helper to render info card
  const InfoCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: any }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
        <Icon className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
          <p className="text-sm text-slate-800 font-medium break-words">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="lg:pl-72">
        <Header setIsSidebarOpen={setIsSidebarOpen} />
        <main className="p-6 min-h-[calc(100vh-73px)] flex flex-col">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-1">My Profile</h2>
            <p className="text-slate-600 text-sm">
              View your complete account information and details.
            </p>
          </div>

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-sm text-slate-600">Loading profile...</div>
            </div>
          )}

          {!loading && error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                {error}
              </div>
            </div>
          )}

          {!loading && !error && profile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Profile Card */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-semibold">
                      {(profile as any)?.profile_image && (profile as any)?.profile_image !== '/media/defaults/patient.png' && (profile as any)?.profile_image !== '/media/defaults/doctor.png' ? (
                        <img
                          src={(profile as any).profile_image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (profile as any)?.lab_logo && (profile as any)?.lab_logo !== '/media/defaults/lab.png' ? (
                        <img
                          src={(profile as any).lab_logo}
                          alt="Lab Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (profile as any)?.full_name?.[0] ??
                        (profile as any)?.lab_name?.[0] ??
                        baseUser?.email?.[0] ??
                        "U"
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {(profile as any)?.full_name ??
                          (profile as any)?.lab_name ??
                          baseUser?.email}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        <span className="font-medium text-emerald-600">
                          {baseUser?.role_display ?? baseUser?.role}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoCard icon={Mail} label="Email" value={baseUser?.email} />
                    <InfoCard
                      icon={Shield}
                      label="Account Status"
                      value={baseUser?.account_status_display ?? baseUser?.account_status ?? "ACTIVE"}
                    />
                    <InfoCard
                      icon={Calendar}
                      label="Member Since"
                      value={baseUser?.created_at ? new Date(baseUser.created_at).toLocaleDateString() : null}
                    />
                    <InfoCard
                      icon={Clock}
                      label="Last Login"
                      value={baseUser?.last_login_at ? new Date(baseUser.last_login_at).toLocaleString() : "Never"}
                    />
                  </div>
                </div>

                {/* PATIENT Details */}
                {userRole === "PATIENT" && (profile as PatientProfile) && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-emerald-600" />
                      Patient Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoCard icon={UserIcon} label="Full Name" value={(profile as PatientProfile).full_name} />
                      <InfoCard icon={Phone} label="Mobile" value={(profile as PatientProfile).mobile} />
                      <InfoCard
                        icon={Calendar}
                        label="Date of Birth"
                        value={(profile as PatientProfile).date_of_birth ? new Date((profile as PatientProfile).date_of_birth!).toLocaleDateString() : null}
                      />
                      <InfoCard icon={UserIcon} label="Gender" value={(profile as PatientProfile).gender_details?.gender_value} />
                      <InfoCard
                        icon={Activity}
                        label="Blood Group"
                        value={(profile as PatientProfile).blood_group_details?.blood_group_value}
                      />
                      <InfoCard
                        icon={UserIcon}
                        label="Emergency Contact"
                        value={(profile as PatientProfile).emergency_contact_name}
                      />
                      <InfoCard
                        icon={Phone}
                        label="Emergency Phone"
                        value={(profile as PatientProfile).emergency_contact_phone}
                      />
                    </div>

                    {(profile as PatientProfile).address && (
                      <div className="mt-3">
                        <InfoCard
                          icon={MapPin}
                          label="Address"
                          value={`${(profile as PatientProfile).address}${(profile as PatientProfile).city ? ', ' + (profile as PatientProfile).city : ''}${(profile as PatientProfile).state ? ', ' + (profile as PatientProfile).state : ''}${(profile as PatientProfile).pincode ? ' - ' + (profile as PatientProfile).pincode : ''}`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* DOCTOR Details */}
                {userRole === "DOCTOR" && (profile as DoctorProfile) && (
                  <>
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-emerald-600" />
                        Doctor Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InfoCard icon={UserIcon} label="Full Name" value={(profile as DoctorProfile).full_name} />
                        <InfoCard icon={Phone} label="Phone Number" value={(profile as DoctorProfile).phone_number} />
                        <InfoCard
                          icon={UserIcon}
                          label="Gender"
                          value={(profile as DoctorProfile).gender_details?.gender_value}
                        />
                        <InfoCard
                          icon={FileText}
                          label="Registration Number"
                          value={(profile as DoctorProfile).registration_number}
                        />
                        <InfoCard
                          icon={Award}
                          label="Experience"
                          value={`${(profile as DoctorProfile).experience_years} years`}
                        />
                        <InfoCard
                          icon={Activity}
                          label="Consultation Fee"
                          value={(profile as DoctorProfile).consultation_fee ? `₹${(profile as DoctorProfile).consultation_fee}` : null}
                        />
                        <InfoCard
                          icon={Calendar}
                          label="Joining Date"
                          value={(profile as DoctorProfile).joining_date ? new Date((profile as DoctorProfile).joining_date!).toLocaleDateString() : null}
                        />
                        <InfoCard
                          icon={Shield}
                          label="Verification Status"
                          value={(profile as DoctorProfile).verification_status_display}
                        />
                      </div>

                      {(profile as DoctorProfile).verification_notes && (
                        <div className="mt-3">
                          <InfoCard
                            icon={FileText}
                            label="Verification Notes"
                            value={(profile as DoctorProfile).verification_notes}
                          />
                        </div>
                      )}

                      {(profile as DoctorProfile).verified_at && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InfoCard
                            icon={Shield}
                            label="Verified By"
                            value={(profile as DoctorProfile).verified_by_details?.email ?? "System"}
                          />
                          <InfoCard
                            icon={Calendar}
                            label="Verified At"
                            value={new Date((profile as DoctorProfile).verified_at!).toLocaleString()}
                          />
                        </div>
                      )}
                    </div>

                    {/* Qualifications */}
                    {(profile as DoctorProfile).qualifications && (profile as DoctorProfile).qualifications.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Award className="w-5 h-5 text-emerald-600" />
                          Qualifications
                        </h4>
                        <div className="space-y-3">
                          {(profile as DoctorProfile).qualifications.map((qual, idx) => (
                            <div key={idx} className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                              <h5 className="font-semibold text-slate-900 mb-2">
                                {qual.qualification_details?.qualification_name} ({qual.qualification_details?.qualification_code})
                              </h5>
                              <div className="text-sm text-slate-600 space-y-1">
                                <p><span className="font-medium">Institution:</span> {qual.institution}</p>
                                <p><span className="font-medium">Year:</span> {qual.year_of_completion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* LAB Details */}
                {userRole === "LAB" && (profile as LabProfile) && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                      Laboratory Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoCard icon={Building2} label="Lab Name" value={(profile as LabProfile).lab_name} />
                      <InfoCard icon={FileText} label="License Number" value={(profile as LabProfile).license_number} />
                      <InfoCard icon={Phone} label="Phone Number" value={(profile as LabProfile).phone_number} />
                      <InfoCard
                        icon={Shield}
                        label="Verification Status"
                        value={(profile as LabProfile).verification_status_display}
                      />
                    </div>

                    <div className="mt-3">
                      <InfoCard
                        icon={MapPin}
                        label="Address"
                        value={`${(profile as LabProfile).address}, ${(profile as LabProfile).city}, ${(profile as LabProfile).state} - ${(profile as LabProfile).pincode}`}
                      />
                    </div>

                    {(profile as LabProfile).operating_hours && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Operating Hours
                        </h5>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                            {JSON.stringify((profile as LabProfile).operating_hours, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {(profile as LabProfile).verification_notes && (
                      <div className="mt-3">
                        <InfoCard
                          icon={FileText}
                          label="Verification Notes"
                          value={(profile as LabProfile).verification_notes}
                        />
                      </div>
                    )}

                    {(profile as LabProfile).verified_at && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InfoCard
                          icon={Shield}
                          label="Verified By"
                          value={(profile as LabProfile).verified_by_details?.email ?? "System"}
                        />
                        <InfoCard
                          icon={Calendar}
                          label="Verified At"
                          value={new Date((profile as LabProfile).verified_at!).toLocaleString()}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ADMIN/STAFF Details */}
                {(userRole === "ADMIN" || userRole === "STAFF") && (profile as AdminStaffProfile) && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      Administrator Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoCard
                        icon={UserIcon}
                        label="Role"
                        value={(profile as AdminStaffProfile).role_display}
                      />
                      <InfoCard
                        icon={Shield}
                        label="Account Status"
                        value={(profile as AdminStaffProfile).account_status_display}
                      />
                      <InfoCard
                        icon={Shield}
                        label="Staff Member"
                        value={(profile as AdminStaffProfile).is_staff ? "Yes" : "No"}
                      />
                      <InfoCard
                        icon={Shield}
                        label="Superuser"
                        value={(profile as AdminStaffProfile).is_superuser ? "Yes" : "No"}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Security & Account */}
              <div className="space-y-6">
                {/* Security Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    Security
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Email Verified</span>
                      <span className={`font-semibold ${baseUser?.email_verified ? 'text-emerald-600' : 'text-red-600'}`}>
                        {baseUser?.email_verified ? "✓ Yes" : "✗ No"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Two Factor Auth</span>
                      <span className={`font-semibold ${baseUser?.two_factor_enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {baseUser?.two_factor_enabled ? "✓ Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Account Active</span>
                      <span className={`font-semibold ${baseUser?.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                        {baseUser?.is_active ? "✓ Yes" : "✗ No"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Activity */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Activity
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-500 text-xs mb-1">Account Created</p>
                      <p className="text-slate-800 font-medium">
                        {baseUser?.created_at ? new Date(baseUser.created_at).toLocaleString() : "—"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-500 text-xs mb-1">Last Updated</p>
                      <p className="text-slate-800 font-medium">
                        {baseUser?.updated_at ? new Date(baseUser.updated_at).toLocaleString() : "—"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-500 text-xs mb-1">Last Login</p>
                      <p className="text-slate-800 font-medium">
                        {baseUser?.last_login_at ? new Date(baseUser.last_login_at).toLocaleString() : "Never"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default ProfilePage;
