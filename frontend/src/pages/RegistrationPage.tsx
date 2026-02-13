import React, { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  User,
  Calendar,
  Phone,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { apiService, handleApiError } from "../services/api";
import {
  BloodGroup,
  DoctorQualification,
  Gender,
  Qualification,
  PatientRegistrationData,
  DoctorRegistrationData,
  LabRegistrationData,
} from "../types";

/**
 * RegistrationPage.tsx
 *
 * Full-page registration form with three selectable roles: Patient (default), Doctor, Lab.
 * Fields shown change dynamically to match the Django models you saved:
 *  - Patient -> fields from Patient model
 *  - Doctor  -> fields from Doctor model (+ qualifications sub-form)
 *  - Lab     -> fields from Lab model
 *
 * No external network requests — handleSubmit currently collects a payload that matches model shapes
 * and logs it to console for integration with your backend later.
 */

type Role = "PATIENT" | "DOCTOR" | "LAB";

const RegistrationPage: React.FC = () => {
  const [role, setRole] = useState<Role>("PATIENT"); // default patient
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Common fields (some used only by specific roles)
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const [genderId, setGenderId] = useState<number | null>(null);
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  // Patient-specific
  const [bloodGroup, setBloodGroup] = useState<number | null>(null);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  // Doctor-specific
  const [experienceYears, setExperienceYears] = useState<string>("0.00");
  const [consultationFee, setConsultationFee] = useState<string>("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [doctorGenderId, setDoctorGenderId] = useState<number | null>(null);
  const [joiningDate, setJoiningDate] = useState<string | null>(null);
  const [doctorPhone, setDoctorPhone] = useState("");
  const [qualifications, setQualifications] = useState<
    {
      qualification_id: number | null;
      institution?: string;
      year_of_completion?: string;
    }[]
  >([]);

  // Lab-specific
  const [labName, setLabName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [labPhone, setLabPhone] = useState("");
  const [labLogoFile, setLabLogoFile] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [operatingHoursText, setOperatingHoursText] = useState<string>(
    `{"monday":"09:00-18:00","tuesday":"09:00-18:00"}`,
  ); // small helper for JSONField input

  const [bloodGroupOptions, setBloodGroupOptions] = useState<BloodGroup[]>([]);
  const [genderOptions, setGenderOptions] = useState<Gender[]>([]);
  const [qualificationOptions, setQualificationOptions] = useState<Qualification[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSupportingData = async () => {
      try {
        const [bloodGroups, genders, qualifications] = await Promise.all([
          apiService.getBloodGroups(),
          apiService.getGenders(),
          apiService.getQualifications(),
        ]);

        console.log('Loaded blood groups:', bloodGroups);
        console.log('Loaded genders:', genders);
        console.log('Loaded qualifications:', qualifications);

        setBloodGroupOptions(bloodGroups);
        setGenderOptions(genders);
        setQualificationOptions(qualifications);
      } catch (e) {
        console.error("Failed to load supporting data", e);
      }
    };

    loadSupportingData();
  }, []);

  // simple helper to reset role-specific fields when switching roles
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    // reset some fields (keep email/password/common)
    setFullName("");
    setDateOfBirth(null);
    setGenderId(null);
    setMobile("");
    setAddress("");
    setCity("");
    setStateName("");
    setPincode("");

    setBloodGroup(null);
    setEmergencyName("");
    setEmergencyPhone("");
    setProfileImageFile(null);

    setExperienceYears("0.00");
    setConsultationFee("");
    setRegistrationNumber("");
    setJoiningDate(null);
    setDoctorPhone("");
    setQualifications([]);

    setLabName("");
    setLicenseNumber("");
    setLabPhone("");
    setLabLogoFile(null);
    setOperatingHoursText(`{"monday":"09:00-18:00","tuesday":"09:00-18:00"}`);
  };

  const addQualification = () => {
    setQualifications((prev) => [
      ...prev,
      {
        qualification_id: null,
        institution: "",
        year_of_completion: "",
      },
    ]);
  };

  const updateQualification = (index: number, key: string, value: string | number) => {
    setQualifications((prev) => {
      const copy = [...prev];
      if (key === 'qualification_id') {
        copy[index][key] = value as number;
      } else {
        // @ts-ignore
        copy[index][key] = value;
      }
      return copy;
    });
  };

  const removeQualification = (index: number) => {
    setQualifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
  ) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setter(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    const performRegistration = async () => {
      setIsSubmitting(true);
      try {
        if (role === "PATIENT") {
          if (!genderId) {
            toast.error("Please select a gender.");
            return;
          }

          const payload: PatientRegistrationData = {
            email,
            password,
            password_confirm: passwordConfirm,
            full_name: fullName,
            mobile,
            date_of_birth: dateOfBirth || undefined,
            gender_id: genderId,
            blood_group_id: bloodGroup || undefined,
            address: address || undefined,
            city: city || undefined,
            state: stateName || undefined,
            pincode: pincode || undefined,
          };

          const response = await apiService.registerPatient(payload);
          const { user, tokens } = response.data;
          localStorage.setItem("access_token", tokens.access_token);
          localStorage.setItem("refresh_token", tokens.refresh_token);
          localStorage.setItem("user", JSON.stringify(user));
          updateUser(user);
          toast.success("Patient registered successfully!");

          // Redirect to profile after a short delay
          setTimeout(() => {
            navigate("/profile");
          }, 1500);
          return;
        }

        if (role === "DOCTOR") {
          if (!doctorGenderId) {
            toast.error("Please select a gender for the doctor.");
            return;
          }

          const mappedQualifications: DoctorQualification[] = qualifications
            .filter((q) => q.qualification_id !== null)
            .map((q) => ({
              qualification: q.qualification_id as number,
              institution: q.institution || "",
              year_of_completion:
                Number(q.year_of_completion) || new Date().getFullYear(),
            }));

          const payload: DoctorRegistrationData = {
            email,
            password,
            password_confirm: passwordConfirm,
            full_name: fullName,
            phone_number: doctorPhone,
            registration_number: registrationNumber,
            gender_id: doctorGenderId,
            experience_years: parseFloat(experienceYears || "0"),
            consultation_fee: consultationFee
              ? parseFloat(consultationFee)
              : undefined,
            qualifications: mappedQualifications,
          };

          const response = await apiService.registerDoctor(payload);
          const { user, tokens } = response.data;
          localStorage.setItem("access_token", tokens.access_token);
          localStorage.setItem("refresh_token", tokens.refresh_token);
          localStorage.setItem("user", JSON.stringify(user));
          updateUser(user);
          toast.success(
            "Doctor registered successfully! Account pending verification.",
          );

          // Redirect to profile after a short delay
          setTimeout(() => {
            navigate("/profile");
          }, 1500);
          return;
        }

        if (role === "LAB") {
          let operating_hours: any = null;
          try {
            operating_hours = JSON.parse(operatingHoursText);
          } catch (err) {
            console.warn(
              "operating_hours JSON parse failed; sending as null",
              err,
            );
            operating_hours = null;
          }

          const payload: LabRegistrationData = {
            email,
            password,
            password_confirm: passwordConfirm,
            lab_name: labName,
            license_number: licenseNumber || undefined,
            address,
            city,
            state: stateName,
            pincode,
            phone_number: labPhone || undefined,
            operating_hours: operating_hours || undefined,
          };

          const response = await apiService.registerLab(payload);
          const { user, tokens } = response.data;
          localStorage.setItem("access_token", tokens.access_token);
          localStorage.setItem("refresh_token", tokens.refresh_token);
          localStorage.setItem("user", JSON.stringify(user));
          updateUser(user);
          toast.success(
            "Lab registered successfully! Account pending verification.",
          );

          // Redirect to profile after a short delay
          setTimeout(() => {
            navigate("/profile");
          }, 1500);
          return;
        }
      } catch (err: any) {
        const message = handleApiError(err);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    };

    void performRegistration();
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Header setIsSidebarOpen={setIsSidebarOpen} />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Role selector */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                onClick={() => handleRoleChange("PATIENT")}
                className={`px-4 py-2 rounded-lg cursor-pointer select-none ${role === "PATIENT"
                  ? "bg-emerald-500 text-white shadow"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                Patient
              </div>
              <div
                onClick={() => handleRoleChange("DOCTOR")}
                className={`px-4 py-2 rounded-lg cursor-pointer select-none ${role === "DOCTOR"
                  ? "bg-emerald-500 text-white shadow"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                Doctor
              </div>
              <div
                onClick={() => handleRoleChange("LAB")}
                className={`px-4 py-2 rounded-lg cursor-pointer select-none ${role === "LAB"
                  ? "bg-emerald-500 text-white shadow"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                Lab
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Account fields */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  placeholder="Create a strong password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Role-specific main fields */}
            {role === "PATIENT" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Date of birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={dateOfBirth ?? ""}
                        onChange={(e) => setDateOfBirth(e.target.value || null)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={genderId ?? ""}
                      onChange={(e) => setGenderId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm pl-3"
                    >
                      <option value="">Select Gender</option>
                      {genderOptions.map((g) => (
                        <option key={g.gender_id} value={g.gender_id}>
                          {g.gender_value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Blood group
                    </label>
                    <select
                      value={bloodGroup ?? ""}
                      onChange={(e) => setBloodGroup(e.target.value ? Number(e.target.value) : null)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm pl-3"
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroupOptions.map((bg) => (
                        <option
                          key={bg.blood_group_id}
                          value={bg.blood_group_id}
                        >
                          {bg.blood_group_value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Mobile
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        placeholder="+91-9876543210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Emergency contact name
                    </label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                      placeholder="Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Emergency contact phone
                    </label>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                      placeholder="+91-9XXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Profile image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setProfileImageFile)}
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                  />
                  <input
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="State"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                  />
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                  />
                </div>
              </div>
            )}

            {role === "DOCTOR" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      placeholder="Dr. Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={doctorGenderId ?? ""}
                      onChange={(e) =>
                        setDoctorGenderId(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm pl-3"
                    >
                      <option value="">Select gender</option>
                      {genderOptions.map((g) => (
                        <option key={g.gender_id} value={g.gender_id}>
                          {g.gender_value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Consultation fee
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                      placeholder="e.g. 500.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={doctorPhone}
                      onChange={(e) => setDoctorPhone(e.target.value)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Registration number
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Joining date
                    </label>
                    <input
                      type="date"
                      value={joiningDate ?? ""}
                      onChange={(e) => setJoiningDate(e.target.value || null)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Profile image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setProfileImageFile)}
                    />
                  </div>
                </div>

                {/* Qualifications subform */}
                <div className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-700">
                      Qualifications
                    </div>
                    <button
                      type="button"
                      onClick={addQualification}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {qualifications.length === 0 && (
                    <div className="text-xs text-slate-500">
                      No qualifications added yet.
                    </div>
                  )}

                  <div className="space-y-2">
                    {qualifications.map((q, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <select
                          value={q.qualification_id || ""}
                          onChange={(e) =>
                            updateQualification(
                              idx,
                              "qualification_id",
                              Number(e.target.value),
                            )
                          }
                          className="sm:col-span-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                        >
                          <option value="">Select Qualification</option>
                          {qualificationOptions.map((qual) => (
                            <option key={qual.qualification_id} value={qual.qualification_id}>
                              {qual.qualification_name} ({qual.qualification_code})
                            </option>
                          ))}
                        </select>
                        <input
                          value={q.institution || ""}
                          onChange={(e) =>
                            updateQualification(
                              idx,
                              "institution",
                              e.target.value,
                            )
                          }
                          placeholder="Institution"
                          className="sm:col-span-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                        />
                        <input
                          type="number"
                          value={q.year_of_completion || ""}
                          onChange={(e) =>
                            updateQualification(
                              idx,
                              "year_of_completion",
                              e.target.value,
                            )
                          }
                          placeholder="Year"
                          className="sm:col-span-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                        />
                        <div className="sm:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeQualification(idx)}
                            className="p-2 rounded bg-red-50 hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address block */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                  />
                  <input
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="State"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                  />
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                  />
                </div>
              </div>
            )}

            {role === "LAB" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Lab name
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      required
                      className="w-full pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      placeholder="Laboratory Pvt Ltd"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      License number
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={labPhone}
                      onChange={(e) => setLabPhone(e.target.value)}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Lab logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setLabLogoFile)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Operating hours (JSON)
                  </label>
                  <textarea
                    value={operatingHoursText}
                    onChange={(e) => setOperatingHoursText(e.target.value)}
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    rows={3}
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    Example:{" "}
                    {'{"monday":"09:00-18:00","tuesday":"09:00-18:00"}'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                  />
                  <input
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="State"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                  />
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>All data maps to your backend models</span>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow"
              >
                <span>Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RegistrationPage;
