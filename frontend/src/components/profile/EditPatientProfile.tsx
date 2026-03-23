import React, { useEffect, useState, useCallback } from "react";
import { useFormik } from "formik";
import {
  X,
  Save,
  User,
  Phone,
  MapPin,
  Heart,
  Activity,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { PatientProfile, BloodGroup, Gender } from "../../types";
import { getBloodGroups, getFieldErrors, getGenders, handleApiError } from "../../services/api";
import { updatePatientProfile } from "../../services/patient_api";
import { editPatientProfileSchema } from "../../validation/schemas";
import { useFormField } from "../../hooks/useFormField";
import { FieldError } from "../common/FieldError";

interface EditPatientProfileProps {
  profile: PatientProfile;
  onClose: () => void;
  onUpdate: (updatedProfile: PatientProfile) => void;
}

interface EditPatientFormValues {
  full_name: string;
  mobile: string;
  date_of_birth: string;
  gender_id: string;
  blood_group_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: {
    address_line: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const EditPatientProfile: React.FC<EditPatientProfileProps> = React.memo(({
  profile,
  onClose,
  onUpdate,
}) => {
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const toast = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bgs, gs] = await Promise.all([
          getBloodGroups(),
          getGenders(),
        ]);
        setBloodGroups(bgs);
        setGenders(gs);
      } catch (err) {
        console.error("Failed to load dropdown data", err);
      }
    };
    loadData();
  }, []);

  const handleSubmit = useCallback(async (values: EditPatientFormValues, { setSubmitting, setErrors }: any) => {
    try {
      const payload = {
        full_name: values.full_name,
        mobile: values.mobile,
        date_of_birth: values.date_of_birth || undefined,
        gender_id: values.gender_id ? Number(values.gender_id) : undefined,
        blood_group_id: values.blood_group_id
          ? Number(values.blood_group_id)
          : undefined,
        emergency_contact_name: values.emergency_contact_name || undefined,
        emergency_contact_phone: values.emergency_contact_phone || undefined,
        address: {
          address_line: values.address.address_line,
          city: values.address.city,
          state: values.address.state,
          pincode: values.address.pincode,
        },
      };

      const updated = await updatePatientProfile(payload);
      toast.success("Profile updated successfully!");
      onUpdate(updated);
      onClose();
    } catch (error) {
      const fe = getFieldErrors(error);
      if (Object.keys(fe).length > 0) {
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

  const formik = useFormik<EditPatientFormValues>({
    initialValues: {
      full_name: profile.full_name || "",
      mobile: profile.mobile || "",
      date_of_birth: profile.date_of_birth || "",
      gender_id: profile.gender_details?.gender_id?.toString() ||
        genders.find(g => g.gender_value === ((profile as any).user?.gender || (profile as any).gender))?.gender_id?.toString() || "",
      blood_group_id:
        profile.blood_group_details?.blood_group_id?.toString() ||
        bloodGroups.find(bg => bg.blood_group_value === ((profile as any).user?.blood_group || (profile as any).blood_group))?.blood_group_id?.toString() || "",
      emergency_contact_name: profile.emergency_contact_name || "",
      emergency_contact_phone: profile.emergency_contact_phone || "",
      address: {
        address_line: (profile as any).user?.address_line || (profile as any).address_line || profile.address?.address_line || "",
        city: (profile as any).user?.city || (profile as any).city || profile.address?.city || "",
        state: (profile as any).user?.state || (profile as any).state || profile.address?.state || "",
        pincode: (profile as any).user?.pincode || (profile as any).pincode || profile.address?.pincode || "",
      },
    },
    validationSchema: editPatientProfileSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: handleSubmit,
    enableReinitialize: true,
  });

  const { getError, inputCls } = useFormField(formik.errors, formik.touched);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-600" />
            Edit Patient Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form
          onSubmit={formik.handleSubmit}
          noValidate
          className="p-6 space-y-6"
        >
          {/* Personal Information */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formik.values.full_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("full_name")}
                  placeholder="Full name"
                />
                <FieldError message={getError("full_name")} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    name="mobile"
                    value={formik.values.mobile}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    maxLength={10}
                    className={`pl-10 ${inputCls("mobile")}`}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <FieldError message={getError("mobile")} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formik.values.date_of_birth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("date_of_birth")}
                />
                <FieldError message={getError("date_of_birth")} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Gender
                </label>
                <select
                  name="gender_id"
                  value={formik.values.gender_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("gender_id")}
                >
                  <option value="">Select Gender</option>
                  {genders.map((g) => (
                    <option key={g.gender_id} value={g.gender_id}>
                      {g.gender_value}
                    </option>
                  ))}
                </select>
                <FieldError message={getError("gender_id")} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Blood Group
                </label>
                <select
                  name="blood_group_id"
                  value={formik.values.blood_group_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("blood_group_id")}
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg.blood_group_id} value={bg.blood_group_id}>
                      {bg.blood_group_value}
                    </option>
                  ))}
                </select>
                <FieldError message={getError("blood_group_id")} />
              </div>
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600" /> Address
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Address Line
                </label>
                <input
                  type="text"
                  name="address.address_line"
                  value={formik.values.address.address_line}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Street address, apartment, etc."
                  className={inputCls("address.address_line")}
                />
                <FieldError message={getError("address.address_line")} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="address.pincode"
                    value={formik.values.address.pincode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    maxLength={6}
                    className={inputCls("address.pincode")}
                    placeholder="6-digit pincode"
                  />
                  <FieldError message={getError("address.pincode")} />
                </div>
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Activity className="w-4 h-4 text-emerald-600" /> Emergency
              Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formik.values.emergency_contact_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputCls("emergency_contact_name")}
                  placeholder="Emergency contact name"
                />
                <FieldError message={getError("emergency_contact_name")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formik.values.emergency_contact_phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  maxLength={10}
                  className={inputCls("emergency_contact_phone")}
                  placeholder="10-digit phone number"
                />
                <FieldError message={getError("emergency_contact_phone")} />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {formik.isSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

EditPatientProfile.displayName = "EditPatientProfile";
export default EditPatientProfile;