import React, { useCallback } from "react";
import { useFormik } from "formik";
import { X, Save, Building2, Phone, MapPin } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { LabProfile } from "../../types";
import { getFieldErrors, handleApiError } from "../../services/api";
import { updateLabProfile } from "../../services/lab_api";
import { editLabProfileSchema } from "../../validation/schemas";
import { useFormField } from "../../hooks/useFormField";
import { FieldError } from "../common/FieldError";

interface EditLabProfileProps {
  profile: LabProfile;
  onClose: () => void;
  onUpdate: (updatedProfile: LabProfile) => void;
}

interface EditLabFormValues {
  lab_name: string;
  phone_number: string;
  address: {
    address_line: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const EditLabProfile: React.FC<EditLabProfileProps> = React.memo(({
  profile,
  onClose,
  onUpdate,
}) => {
  const toast = useToast();

  const handleSubmit = useCallback(async (values: EditLabFormValues, { setSubmitting, setErrors }: any) => {
    try {
      const payload: Record<string, unknown> = {
        lab_name: values.lab_name,
        phone_number: values.phone_number || undefined,
        address: {
          address_line: values.address.address_line,
          city: values.address.city,
          state: values.address.state,
          pincode: values.address.pincode,
        },
      };

      const updated = await updateLabProfile(payload);
      toast.success("Lab profile updated successfully!");
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

  const formik = useFormik<EditLabFormValues>({
    initialValues: {
      lab_name: profile.lab_name || "",
      phone_number: profile.phone_number || "",
      address: {
        address_line: profile.address?.address_line || profile.address_line || "",
        city: profile.address?.city || profile.city || "",
        state: profile.address?.state || profile.state || "",
        pincode: profile.address?.pincode || profile.pincode || "",
      },
    },
    validationSchema: editLabProfileSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: handleSubmit,
  });

  const { getError, inputCls } = useFormField(formik.errors, formik.touched);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Edit Lab Profile
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={formik.handleSubmit}
          noValidate
          className="p-6 space-y-6"
        >
          {/* ── Lab Info ─────────────────────────────────────────────────── */}
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" /> Lab Information
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Lab Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="lab_name"
                  value={formik.values.lab_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Lab / Diagnostic Centre name"
                  className={inputCls("lab_name")}
                />
                <FieldError message={getError("lab_name")} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="phone_number"
                    value={formik.values.phone_number}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    maxLength={10}
                    placeholder="10-digit phone number"
                    className={`pl-10 ${inputCls("phone_number")}`}
                  />
                </div>
                <FieldError message={getError("phone_number")} />
              </div>
            </div>
          </section>

          {/* ── Address ──────────────────────────────────────────────────── */}
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> Lab Address
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Address Line
                </label>
                <textarea
                  name="address.address_line"
                  value={formik.values.address.address_line}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  rows={2}
                  placeholder="Street, building, floor…"
                  className={inputCls("address.address_line")}
                />
                <FieldError message={getError("address.address_line")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    City
                  </label>
                  <input
                    name="address.city"
                    value={formik.values.address.city}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="City"
                    className={inputCls("address.city")}
                  />
                  <FieldError message={getError("address.city")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    State
                  </label>
                  <input
                    name="address.state"
                    value={formik.values.address.state}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="State"
                    className={inputCls("address.state")}
                  />
                  <FieldError message={getError("address.state")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Pincode
                  </label>
                  <input
                    name="address.pincode"
                    value={formik.values.address.pincode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    maxLength={6}
                    placeholder="6-digit PIN"
                    className={inputCls("address.pincode")}
                  />
                  <FieldError message={getError("address.pincode")} />
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
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
        </form>
      </div>
    </div>
  );
});

EditLabProfile.displayName = "EditLabProfile";
export default EditLabProfile;