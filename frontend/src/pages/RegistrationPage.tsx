import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
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
import { RoleSelector } from "../components/registration/RoleSelector";
import { AccountFields } from "../components/registration/AccountFields";
import { PatientFields } from "../components/registration/PatientFields";
import { DoctorFields } from "../components/registration/DoctorFields";
import { LabFields } from "../components/registration/LabFields";

type Role = "PATIENT" | "DOCTOR" | "LAB";

const RegistrationPage: React.FC = () => {
  const [role, setRole] = useState<Role>("PATIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Common fields
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [labLogoFile, setLabLogoFile] = useState<File | null>(null);
  const [operatingHoursText, setOperatingHoursText] = useState<string>(
    `{"monday":"09:00-18:00","tuesday":"09:00-18:00"}`,
  );

  const [bloodGroupOptions, setBloodGroupOptions] = useState<BloodGroup[]>([]);
  const [genderOptions, setGenderOptions] = useState<Gender[]>([]);
  const [qualificationOptions, setQualificationOptions] = useState<Qualification[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSupportingData = async () => {
      try {
        const [bloodGroups, genders, qualificationsData] = await Promise.all([
          apiService.getBloodGroups(),
          apiService.getGenders(),
          apiService.getQualifications(),
        ]);
        setBloodGroupOptions(bloodGroups);
        setGenderOptions(genders);
        setQualificationOptions(qualificationsData);
      } catch (e) {
        console.error("Failed to load supporting data", e);
      }
    };
    loadSupportingData();
  }, []);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    // Reset fields logic remains same...
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
          const { user, access_token } = response;

          // Store access token in localStorage
          localStorage.setItem('access_token', access_token);
          localStorage.setItem("user", JSON.stringify(user));
          updateUser(user);
          toast.success("Patient registered successfully!");
          setTimeout(() => navigate("/profile"), 1500);
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
              year_of_completion: Number(q.year_of_completion) || new Date().getFullYear(),
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
            consultation_fee: consultationFee ? parseFloat(consultationFee) : undefined,
            qualifications: mappedQualifications,
          };

          const response = await apiService.registerDoctor(payload);
          const { user, access_token } = response;

          // Store access token in localStorage
          localStorage.setItem('access_token', access_token);
          localStorage.setItem("user", JSON.stringify(user));
          updateUser(user);
          toast.success("Doctor registered successfully! Account pending verification.");
          setTimeout(() => navigate("/profile"), 1500);
          return;
        }

        if (role === "LAB") {
          let operating_hours: any = null;
          try {
            operating_hours = JSON.parse(operatingHoursText);
          } catch (err) {
            console.warn("operating_hours JSON parse failed; sending as null", err);
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
          const { user, access_token } = response;

          // Store access token in localStorage
          localStorage.setItem('access_token', access_token);
          localStorage.setItem("user", JSON.stringify(user));
          updateUser(user);
          toast.success("Lab registered successfully! Account pending verification.");
          setTimeout(() => navigate("/profile"), 1500);
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
      <Header setIsSidebarOpen={setIsSidebarOpen} />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pb-20">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

          <RoleSelector role={role} onChange={handleRoleChange} />

          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            <AccountFields
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              passwordConfirm={passwordConfirm} setPasswordConfirm={setPasswordConfirm}
            />

            {role === "PATIENT" && (
              <PatientFields
                fullName={fullName} setFullName={setFullName}
                dateOfBirth={dateOfBirth} setDateOfBirth={setDateOfBirth}
                genderId={genderId} setGenderId={setGenderId}
                bloodGroup={bloodGroup} setBloodGroup={setBloodGroup}
                mobile={mobile} setMobile={setMobile}
                emergencyName={emergencyName} setEmergencyName={setEmergencyName}
                emergencyPhone={emergencyPhone} setEmergencyPhone={setEmergencyPhone}
                address={address} setAddress={setAddress}
                city={city} setCity={setCity}
                stateName={stateName} setStateName={setStateName}
                pincode={pincode} setPincode={setPincode}
                handleFileChange={(e) => handleFileChange(e, setProfileImageFile)}
                genderOptions={genderOptions}
                bloodGroupOptions={bloodGroupOptions}
              />
            )}

            {role === "DOCTOR" && (
              <DoctorFields
                fullName={fullName} setFullName={setFullName}
                genderId={doctorGenderId} setGenderId={setDoctorGenderId}
                experienceYears={experienceYears} setExperienceYears={setExperienceYears}
                consultationFee={consultationFee} setConsultationFee={setConsultationFee}
                phone={doctorPhone} setPhone={setDoctorPhone}
                registrationNumber={registrationNumber} setRegistrationNumber={setRegistrationNumber}
                joiningDate={joiningDate} setJoiningDate={setJoiningDate}
                handleFileChange={(e) => handleFileChange(e, setProfileImageFile)}
                qualifications={qualifications}
                addQualification={addQualification}
                updateQualification={updateQualification}
                removeQualification={removeQualification}
                genderOptions={genderOptions}
                qualificationOptions={qualificationOptions}
              />
            )}

            {role === "LAB" && (
              <LabFields
                labName={labName} setLabName={setLabName}
                licenseNumber={licenseNumber} setLicenseNumber={setLicenseNumber}
                labPhone={labPhone} setLabPhone={setLabPhone}
                address={address} setAddress={setAddress}
                city={city} setCity={setCity}
                stateName={stateName} setStateName={setStateName}
                pincode={pincode} setPincode={setPincode}
                operatingHoursText={operatingHoursText} setOperatingHoursText={setOperatingHoursText}
                handleFileChange={(e) => handleFileChange(e, setLabLogoFile)}
              />
            )}

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Registering..." : `Register as ${role.charAt(0) + role.slice(1).toLowerCase()}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegistrationPage;
