import React, { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import { X, Save, User, Stethoscope, MapPin } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { DoctorProfile, Gender } from "../../types";
import { getFieldErrors, getGenders, handleApiError } from "../../services/api";
import { updateDoctorProfile } from "../../services/doctor_api";
import { editDoctorProfileSchema } from "../../validation/schemas";
import { useFormField } from "../../hooks/useFormField";
import { FieldError } from "../common/FieldError";

interface EditDoctorProfileProps {
  profile: DoctorProfile;
  onClose: () => void;
  onUpdate: (updatedProfile: DoctorProfile) => void;
}

interface EditDoctorFormValues {
  full_name: string;
  phone_number: string;
  gender_id: string;
  experience_years: string;
  consultation_fee: string;
  address: {
    address_line: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const EditDoctorProfile: React.FC<EditDoctorProfileProps> = React.memo(({
  profile,
  onClose,
  onUpdate,
}) => {
  const [genders, setGenders] = useState<Gender[]>([]);
  const toast = useToast();

  useEffect(() => {
    getGenders().then(setGenders).catch(console.error);
  }, []);

  const handleSubmit = useCallback(async (values: EditDoctorFormValues, { setSubmitting, setErrors }: any) => {
    try {
      const payload: Record<string, unknown> = {
        full_name: values.full_name,
        phone_number: values.phone_number || undefined,
        gender_id: values.gender_id ? Number(values.gender_id) : undefined,
        experience_years: values.experience_years,
        consultation_fee: values.consultation_fee || undefined,
        address: {
          address_line: values.address.address_line,
          city: values.address.city,
          state: values.address.state,
          pincode: values.address.pincode,
        },
      };

      const updated = await updateDoctorProfile(payload);
      toast.success("Profile updated successfully!");
      onUpdate(updated);
      onClose();
    } catch (error) {
      const fe = getFieldErrors(error);
      if (Object.keys(fe).length > 0) {
        // Remap flat server errors (e.g. "address.city") back to nested shape
        const remapped: Record<string, any> = {};
        for (const [key, msg] of Object.entries(fe)) {
          const parts = key.split(".");
          if (parts.length === 2) {
            remapped[parts[0]] = {
              ...(remapped[parts[0]] || {}),
              [parts[1]]: msg,
            };
          } else {
            remapped[key] = msg;
          }
        }
        setErrors(remapped);
        toast.error("Please fix the errors below.");
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setSubmitting(false);
    }
  }, [onClose, onUpdate, toast]);

  const formik = useFormik<EditDoctorFormValues>({
    initialValues: {
      full_name: profile.full_name || "",
      phone_number: profile.phone_number || "",
      gender_id: profile.gender_details?.gender_id?.toString() || "",
      experience_years: profile.experience_years || "0",
      consultation_fee: profile.consultation_fee || "",
      address: {
        address_line: profile.address?.address_line || (profile as any).address_line || "",
        city: profile.address?.city || (profile as any).city || "",
        state: profile.address?.state || (profile as any).state || "",
        pincode: profile.address?.pincode || (profile as any).pincode || "",
      },
    },
    validationSchema: editDoctorProfileSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: handleSubmit,
    enableReinitialize: true,
  });

  const { getError, inputCls } = useFormField(formik.errors, formik.touched);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            Edit Doctor Profile
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form
          onSubmit={formik.handleSubmit}
          noValidate
          className="overflow-y-auto flex-1 p-6 space-y-6"
        >
          {/* ── Personal Info ─────────────────────────────────────────────── */}
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" /> Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="full_name"
                  value={formik.values.full_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("full_name")}
                  placeholder="Dr. Full Name"
                />
                <FieldError message={getError("full_name")} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  name="phone_number"
                  value={formik.values.phone_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  maxLength={10}
                  className={inputCls("phone_number")}
                  placeholder="10-digit phone"
                />
                <FieldError message={getError("phone_number")} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Gender
                </label>
                <select
                  name="gender_id"
                  value={formik.values.gender_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("gender_id")}
                >
                  <option value="">Select gender</option>
                  {genders.map((g) => (
                    <option key={g.gender_id} value={g.gender_id}>
                      {g.gender_value}
                    </option>
                  ))}
                </select>
                <FieldError message={getError("gender_id")} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Experience (years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="experience_years"
                  min="0"
                  step="0.5"
                  value={formik.values.experience_years}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("experience_years")}
                />
                <FieldError message={getError("experience_years")} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  name="consultation_fee"
                  min="0"
                  value={formik.values.consultation_fee}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("consultation_fee")}
                  placeholder="Optional"
                />
                <FieldError message={getError("consultation_fee")} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Registration Number (read-only)
                </label>
                <input
                  value={profile.registration_number}
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          {/* ── Clinic Address ───────────────────────────────────────────── */}
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> Clinic Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Address Line
                </label>
                <input
                  name="address.address_line"
                  value={formik.values.address.address_line}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("address.address_line")}
                  placeholder="Street, Floor, Building…"
                />
                <FieldError message={getError("address.address_line")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  City
                </label>
                <input
                  name="address.city"
                  value={formik.values.address.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("address.city")}
                  placeholder="City"
                />
                <FieldError message={getError("address.city")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  State
                </label>
                <input
                  name="address.state"
                  value={formik.values.address.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("address.state")}
                  placeholder="State"
                />
                <FieldError message={getError("address.state")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Pincode
                </label>
                <input
                  name="address.pincode"
                  value={formik.values.address.pincode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  maxLength={6}
                  className={inputCls("address.pincode")}
                  placeholder="6-digit PIN"
                />
                <FieldError message={getError("address.pincode")} />
              </div>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {formik.isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
});

EditDoctorProfile.displayName = "EditDoctorProfile";
export default EditDoctorProfile;