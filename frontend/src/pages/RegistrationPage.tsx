// frontend/src/pages/RegistrationPage.tsx
import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import { Toaster } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { buildFormData, getBloodGroups, getFieldErrors, getGenders, getQualifications, handleApiError } from "../services/api";
import { registerDoctor } from "../services/doctor_api";
import { registerPatient } from "../services/patient_api";
import { registerLab } from "../services/lab_api";
import { useToast } from "../hooks/useToast";
import {
  BloodGroup,
  DoctorQualificationPayload, // FIX: use write payload type (field: `qualification`)
  DoctorSpecializationPayload, // FIX: added specialization write payload type
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
import { AlertCircle } from "lucide-react";
import {
  patientRegistrationSchema,
  doctorRegistrationSchema,
  labRegistrationSchema,
} from "../validation/schemas";

type Role = "PATIENT" | "DOCTOR" | "LAB";

// ─────────────────────────────────────────────────
// Local form state shapes for qualifications
// ─────────────────────────────────────────────────

/**
 * Intermediate state used by the qualification row UI.
 * `qualification_id` is null when the user hasn't picked one yet.
 */
interface QualificationRow {
  qualification_id: number | null;
  institution: string;
  year_of_completion: string; // kept as string for the text input
}

// ─────────────────────────────────────────────────
// Per-role initial form values
// ─────────────────────────────────────────────────

const accountInitial = {
  email: "",
  password: "",
  password_confirm: "",
};

const patientInitial = {
  ...accountInitial,
  full_name: "",
  mobile: "",
  date_of_birth: "",
  gender_id: null as number | null,
  blood_group_id: null as number | null,
  address_line: "",
  city: "",
  state: "",
  pincode: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

const doctorInitial = {
  ...accountInitial,
  full_name: "",
  phone_number: "",
  registration_number: "",
  gender_id: null as number | null,
  experience_years: 0,
  consultation_fee: "" as string | number,
  address_line: "",
  city: "",
  state: "",
  pincode: "",
};

const labInitial = {
  ...accountInitial,
  lab_name: "",
  license_number: "",
  phone_number: "",
  address_line: "",
  city: "",
  state: "",
  pincode: "",
  operating_hours_text: `{"monday":"09:00-18:00","tuesday":"09:00-18:00","wednesday":"09:00-18:00","thursday":"09:00-18:00","friday":"09:00-18:00"}`,
};

function schemaForRole(role: Role) {
  if (role === "PATIENT") return patientRegistrationSchema;
  if (role === "DOCTOR") return doctorRegistrationSchema;
  return labRegistrationSchema;
}

function initialValuesForRole(role: Role, googleData?: any) {
  const email = googleData?.email ?? "";
  const full_name =
    `${googleData?.first_name ?? ""} ${googleData?.last_name ?? ""}`.trim();

  if (role === "PATIENT") return { ...patientInitial, email, full_name };
  if (role === "DOCTOR") return { ...doctorInitial, email, full_name };
  return { ...labInitial, email };
}

// ─────────────────────────────────────────────────

const RegistrationPage: React.FC = () => {
  const [role, setRole] = useState<Role>("PATIENT");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Qualification rows (UI state, separate from formik) ───────────────────
  const [qualifications, setQualifications] = useState<QualificationRow[]>([]);

  const [bloodGroupOptions, setBloodGroupOptions] = useState<BloodGroup[]>([]);
  const [genderOptions, setGenderOptions] = useState<Gender[]>([]);
  const [qualificationOptions, setQualificationOptions] = useState<
    Qualification[]
  >([]);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [labLogoFile, setLabLogoFile] = useState<File | null>(null);


  const navigate = useNavigate();
  const location = useLocation();
  const googleData = location.state?.googleData;
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [bgs, gs, quals] = await Promise.all([
          getBloodGroups(),
          getGenders(),
          getQualifications(),
        ]);
        setBloodGroupOptions(bgs);
        setGenderOptions(gs);
        setQualificationOptions(quals);
      } catch (e) {
        console.error("Failed to load supporting data", e);
        toast.warning(
          "Could not load some form options. You can still register.",
        );
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Formik ──────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: initialValuesForRole(role, googleData),
    validationSchema: schemaForRole(role),
    enableReinitialize: false,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        let response;

        if (role === "PATIENT") {
          const v = values as typeof patientInitial;
          if (!v.gender_id) {
            toast.error("Please select a gender.");
            return;
          }
          const payload: PatientRegistrationData = {
            email: v.email,
            password: v.password,
            password_confirm: v.password_confirm,
            full_name: v.full_name,
            mobile: v.mobile,
            date_of_birth: v.date_of_birth || undefined,
            gender_id: v.gender_id,
            blood_group_id: v.blood_group_id || undefined,
            address_line: v.address_line || undefined,
            city: v.city || undefined,
            state: v.state || undefined,
            pincode: v.pincode || undefined,
            emergency_contact_name: v.emergency_contact_name || undefined,
            emergency_contact_phone: v.emergency_contact_phone || undefined,
            oauth_provider: googleData?.oauth_provider,
            oauth_provider_id: googleData?.oauth_provider_id,
          };

          const body = buildFormData(
            payload as Record<string, any>,
            profileImageFile,
            "profile_image",
          );

          response = await registerPatient(body as any);
        } else if (role === "DOCTOR") {
          const v = values as typeof doctorInitial;
          if (!v.gender_id) {
            toast.error("Please select a gender.");
            return;
          }

          // ── FIX: map UI rows → DoctorQualificationPayload ─────────────────
          // Backend `_QualWriteSerializer` expects field name `qualification`
          // (the FK id), NOT `qualification_id`.
          const mappedQuals: DoctorQualificationPayload[] = qualifications
            .filter((q) => q.qualification_id !== null)
            .map((q) => ({
              qualification_id: q.qualification_id as number,
              institution: q.institution || undefined,
              year_of_completion: q.year_of_completion
                ? Number(q.year_of_completion)
                : undefined,
            }));

          const payload: DoctorRegistrationData = {
            email: v.email,
            password: v.password,
            password_confirm: v.password_confirm,
            full_name: v.full_name,
            phone_number: v.phone_number,
            registration_number: v.registration_number,
            gender_id: v.gender_id,
            // FIX: always send a number; `experience_years: 0` is valid and
            // must NOT be coerced to undefined/empty by buildFormData
            experience_years: parseFloat(String(v.experience_years) || "0"),
            consultation_fee: v.consultation_fee
              ? parseFloat(String(v.consultation_fee))
              : undefined,
            address_line: v.address_line || undefined,
            city: v.city || undefined,
            state: v.state || undefined,
            pincode: v.pincode || undefined,
            // FIX: correct payload type — field is `qualification`, not `qualification_id`
            qualifications: mappedQuals.length > 0 ? mappedQuals : undefined,
            oauth_provider: googleData?.oauth_provider,
            oauth_provider_id: googleData?.oauth_provider_id,
          };

          // Qualifications array (and any other arrays/objects) will be
          // JSON-stringified by buildFormData so multipart can carry them.
          // The backend recovers them in DoctorRegistrationSerializer.to_internal_value.
          const body = buildFormData(
            payload as Record<string, any>,
            profileImageFile,
            "profile_image",
          );

          response = await registerDoctor(body as any);
        } else {
          // LAB
          const v = values as typeof labInitial;
          let operatingHours: any[] = [];
          try {
            const parsed = JSON.parse(v.operating_hours_text);
            const weekMap: Record<string, number> = {
              monday: 0,
              tuesday: 1,
              wednesday: 2,
              thursday: 3,
              friday: 4,
              saturday: 5,
              sunday: 6,
            };
            Object.entries(parsed).forEach(([dayKey, timeRange]) => {
              const dayNum = weekMap[dayKey.toLowerCase()];
              if (dayNum !== undefined && typeof timeRange === "string") {
                const [start, end] = timeRange.split("-").map((t) => t.trim());
                if (start && end) {
                  operatingHours.push({
                    day_of_week: dayNum,
                    open_time: start,
                    close_time: end,
                    is_closed: false,
                  });
                }
              }
            });
          } catch {
            // ignore parse error — operating hours are optional
          }

          const payload: LabRegistrationData = {
            email: v.email,
            password: v.password,
            password_confirm: v.password_confirm,
            lab_name: v.lab_name,
            license_number: v.license_number || undefined,
            address_line: v.address_line || undefined,
            city: v.city || undefined,
            state: v.state || undefined,
            pincode: v.pincode || undefined,
            phone_number: v.phone_number || undefined,
            operating_hours:
              operatingHours.length > 0 ? operatingHours : undefined,
            oauth_provider: googleData?.oauth_provider,
            oauth_provider_id: googleData?.oauth_provider_id,
          };

          const body = buildFormData(
            payload as Record<string, any>,
            labLogoFile,
            "lab_logo",
          );

          response = await registerLab(body as any);
        }

        const { user } = response;
        const baseUser = (user as any)?.user ?? user;

        if (baseUser?.email_verified === false || !baseUser?.email_verified) {
          toast.success("Registration successful! Please verify your email.");
          setTimeout(() => {
            navigate("/check-email", { state: { email: baseUser?.email } });
          }, 1000);
        } else {
          // Edge case: pre-verified account (e.g. some OAuth flows)
          const msg =
            role === "PATIENT"
              ? "Patient registered successfully!"
              : `${role.charAt(0) + role.slice(1).toLowerCase()} registered successfully! Account pending verification.`;
          toast.success(msg);
          setTimeout(() => navigate("/login"), 1500);
        }
      } catch (err: any) {
        const fieldErrs = getFieldErrors(err);
        if (Object.keys(fieldErrs).length > 0) {
          setErrors(fieldErrs);
          toast.error("Please fix the errors highlighted in the form.");
        } else {
          toast.error(handleApiError(err));
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setQualifications([]);
    setProfileImageFile(null);
    setLabLogoFile(null);
    formik.resetForm({
      values: initialValuesForRole(newRole, googleData) as any,
    });
  };

  const addQualification = () =>
    setQualifications((prev) => [
      ...prev,
      { qualification_id: null, institution: "", year_of_completion: "" },
    ]);

  const updateQualification = (
    index: number,
    key: string,
    value: string | number,
  ) =>
    setQualifications((prev) => {
      const copy = [...prev];
      (copy[index] as any)[key] = value;
      return copy;
    });

  const removeQualification = (index: number) =>
    setQualifications((prev) => prev.filter((_, i) => i !== index));

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
  ) => {
    const file = e.target.files?.[0] ?? null;
    setter(file);
  };

  // ── Derive combined errors ────────────────────────────────────────────────

  const combinedErrors: Record<string, string> = {};
  Object.entries(formik.errors).forEach(([k, v]) => {
    if (typeof v === "string") combinedErrors[k] = v;
  });

  const hasErrors =
    formik.submitCount > 0 && Object.keys(formik.errors).length > 0;

  const setField = (name: string) => (value: any) =>
    formik.setFieldValue(name, value, true);

  return (
    <>
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{ top: 72, right: 20 }}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "0.875rem",
            fontWeight: 500,
            borderRadius: "12px",
            boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12)",
            padding: "12px 16px",
            maxWidth: "380px",
          },
          success: {
            style: {
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
            },
            iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
          },
          error: {
            duration: 5000,
            style: {
              background: "#fff1f2",
              color: "#9f1239",
              border: "1px solid #fecdd3",
            },
            iconTheme: { primary: "#e11d48", secondary: "#fff1f2" },
          },
        }}
      />
      <Header setIsSidebarOpen={setIsSidebarOpen} />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pb-20">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <RoleSelector role={role} onChange={handleRoleChange} />

          <form
            onSubmit={formik.handleSubmit}
            className="p-6 space-y-6"
            noValidate
          >
            {/* Global error summary */}
            {hasErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Please fix the following errors:
                    </p>
                    <ul className="mt-1 text-xs text-red-700 space-y-0.5">
                      {Object.entries(formik.errors).map(([field, msg]) => (
                        <li key={field}>
                          <span className="font-medium">
                            {field.replace(/_/g, " ")}:
                          </span>{" "}
                          {String(msg)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <AccountFields
              email={formik.values.email as string}
              password={formik.values.password as string}
              passwordConfirm={formik.values.password_confirm as string}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errors={{
                email: formik.errors.email as string | undefined,
                password: formik.errors.password as string | undefined,
                password_confirm: formik.errors.password_confirm as
                  | string
                  | undefined,
              }}
              touched={{
                email: formik.touched.email as boolean | undefined,
                password: formik.touched.password as boolean | undefined,
                password_confirm: formik.touched.password_confirm as
                  | boolean
                  | undefined,
              }}
              readOnlyEmail={!!googleData}
            />

            {role === "PATIENT" && (
              <PatientFields
                fullName={(formik.values as any).full_name}
                setFullName={setField("full_name")}
                dateOfBirth={(formik.values as any).date_of_birth || null}
                setDateOfBirth={(v) =>
                  formik.setFieldValue("date_of_birth", v ?? "")
                }
                genderId={(formik.values as any).gender_id}
                setGenderId={setField("gender_id")}
                bloodGroup={(formik.values as any).blood_group_id}
                setBloodGroup={setField("blood_group_id")}
                mobile={(formik.values as any).mobile}
                setMobile={setField("mobile")}
                emergencyName={(formik.values as any).emergency_contact_name}
                setEmergencyName={setField("emergency_contact_name")}
                emergencyPhone={(formik.values as any).emergency_contact_phone}
                setEmergencyPhone={setField("emergency_contact_phone")}
                addressLine={(formik.values as any).address_line}
                setAddressLine={setField("address_line")}
                city={(formik.values as any).city}
                setCity={setField("city")}
                stateName={(formik.values as any).state}
                setStateName={setField("state")}
                pincode={(formik.values as any).pincode}
                setPincode={setField("pincode")}
                handleFileChange={(e) =>
                  handleFileChange(e, setProfileImageFile)
                }
                genderOptions={genderOptions}
                bloodGroupOptions={bloodGroupOptions}
                fieldErrors={combinedErrors}
                touched={formik.touched as Record<string, boolean>}
                onBlur={(name) => formik.setFieldTouched(name, true)}
              />
            )}

            {role === "DOCTOR" && (
              <DoctorFields
                fullName={(formik.values as any).full_name}
                setFullName={setField("full_name")}
                genderId={(formik.values as any).gender_id}
                setGenderId={setField("gender_id")}
                experienceYears={String(
                  (formik.values as any).experience_years ?? "",
                )}
                setExperienceYears={(v) =>
                  formik.setFieldValue("experience_years", v)
                }
                consultationFee={String(
                  (formik.values as any).consultation_fee ?? "",
                )}
                setConsultationFee={(v) =>
                  formik.setFieldValue("consultation_fee", v)
                }
                phone={(formik.values as any).phone_number}
                setPhone={setField("phone_number")}
                registrationNumber={(formik.values as any).registration_number}
                setRegistrationNumber={setField("registration_number")}
                joiningDate={null}
                setJoiningDate={() => { }}
                addressLine={(formik.values as any).address_line}
                setAddressLine={setField("address_line")}
                city={(formik.values as any).city}
                setCity={setField("city")}
                stateName={(formik.values as any).state}
                setStateName={setField("state")}
                pincode={(formik.values as any).pincode}
                setPincode={setField("pincode")}
                handleFileChange={(e) =>
                  handleFileChange(e, setProfileImageFile)
                }
                qualifications={qualifications}
                addQualification={addQualification}
                updateQualification={updateQualification}
                removeQualification={removeQualification}
                genderOptions={genderOptions}
                qualificationOptions={qualificationOptions}
                fieldErrors={combinedErrors}
                touched={formik.touched as Record<string, boolean>}
                onBlur={(name) => formik.setFieldTouched(name, true)}
              />
            )}

            {role === "LAB" && (
              <LabFields
                labName={(formik.values as any).lab_name}
                setLabName={setField("lab_name")}
                licenseNumber={(formik.values as any).license_number}
                setLicenseNumber={setField("license_number")}
                labPhone={(formik.values as any).phone_number}
                setLabPhone={setField("phone_number")}
                addressLine={(formik.values as any).address_line}
                setAddressLine={setField("address_line")}
                city={(formik.values as any).city}
                setCity={setField("city")}
                stateName={(formik.values as any).state}
                setStateName={setField("state")}
                pincode={(formik.values as any).pincode}
                setPincode={setField("pincode")}
                operatingHoursText={(formik.values as any).operating_hours_text}
                setOperatingHoursText={setField("operating_hours_text")}
                handleFileChange={(e) => handleFileChange(e, setLabLogoFile)}
                fieldErrors={combinedErrors}
                touched={formik.touched as Record<string, boolean>}
                onBlur={(name) => formik.setFieldTouched(name, true)}
              />
            )}

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formik.isSubmitting
                  ? "Registering…"
                  : `Register as ${role.charAt(0) + role.slice(1).toLowerCase()}`}
              </button>
              <p className="mt-3 text-center text-xs text-slate-500">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegistrationPage;
