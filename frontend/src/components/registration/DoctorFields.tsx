// frontend/src/components/registration/DoctorFields.tsx
import React from "react";
import { User, Plus, Trash2, AlertCircle } from "lucide-react";
import { Gender, Qualification } from "../../types";
import axios from "axios";

interface DoctorFieldsProps {
  fullName: string;
  setFullName: (v: string) => void;
  genderId: number | null;
  setGenderId: (v: number | null) => void;
  experienceYears: string;
  setExperienceYears: (v: string) => void;
  consultationFee: string;
  setConsultationFee: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  registrationNumber: string;
  setRegistrationNumber: (v: string) => void;
  joiningDate: string | null;
  setJoiningDate: (v: string | null) => void;
  addressLine: string;
  setAddressLine: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  stateName: string;
  setStateName: (v: string) => void;
  pincode: string;
  setPincode: (v: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  qualifications: {
    qualification_id: number | null;
    institution?: string;
    year_of_completion?: string;
  }[];
  addQualification: () => void;
  updateQualification: (
    index: number,
    key: string,
    value: string | number,
  ) => void;
  removeQualification: (index: number) => void;
  genderOptions: Gender[];
  qualificationOptions: Qualification[];
  fieldErrors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onBlur?: (name: string) => void;
}

const FieldError: React.FC<{
  name: string;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
}> = ({ name, errors, touched }) => {
  const msg = errors?.[name];
  const show = msg && (!touched || touched[name]);
  if (!show) return null;
  return (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" /> {msg}
    </p>
  );
};

export const DoctorFields: React.FC<DoctorFieldsProps> = ({
  fullName,
  setFullName,
  genderId,
  setGenderId,
  experienceYears,
  setExperienceYears,
  consultationFee,
  setConsultationFee,
  phone,
  setPhone,
  registrationNumber,
  setRegistrationNumber,
  joiningDate,
  setJoiningDate,
  addressLine,
  setAddressLine,
  city,
  setCity,
  stateName,
  setStateName,
  pincode,
  setPincode,
  handleFileChange,
  qualifications,
  addQualification,
  updateQualification,
  removeQualification,
  genderOptions,
  qualificationOptions,
  fieldErrors,
  touched,
  onBlur,
}) => {
  const borderCls = (name: string) => {
    const hasErr = fieldErrors?.[name] && (!touched || touched[name]);
    return hasErr ? "border-red-400" : "border-slate-200";
  };

  const blur = (name: string) => () => onBlur?.(name);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="dr-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={blur("full_name")}
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${borderCls(
              "full_name",
            )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
            placeholder="Dr. Full Name"
          />
        </div>
        <FieldError name="full_name" errors={fieldErrors} touched={touched} />
      </div>

      {/* Gender / Experience / Fee */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            value={genderId ?? ""}
            onChange={(e) =>
              setGenderId(e.target.value ? Number(e.target.value) : null)
            }
            onBlur={blur("gender_id")}
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "gender_id",
            )} rounded-lg text-sm pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          >
            <option value="">Select Gender</option>
            {genderOptions.map((g) => (
              <option key={g.gender_id} value={g.gender_id}>
                {g.gender_value}
              </option>
            ))}
          </select>
          <FieldError name="gender_id" errors={fieldErrors} touched={touched} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Experience (years)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            onBlur={blur("experience_years")}
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "experience_years",
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          />
          <FieldError
            name="experience_years"
            errors={fieldErrors}
            touched={touched}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Consultation Fee (₹)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
            onBlur={blur("consultation_fee")}
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "consultation_fee",
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
            placeholder="e.g. 500"
          />
          <FieldError
            name="consultation_fee"
            errors={fieldErrors}
            touched={touched}
          />
        </div>
      </div>

      {/* Phone / Registration Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={blur("phone_number")}
            maxLength={10}
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "phone_number",
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
            placeholder="10-digit phone number"
          />
          <FieldError
            name="phone_number"
            errors={fieldErrors}
            touched={touched}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            onBlur={blur("registration_number")}
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "registration_number",
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
            placeholder="Medical Council Reg. No."
          />
          <FieldError
            name="registration_number"
            errors={fieldErrors}
            touched={touched}
          />
        </div>
      </div>

      {/* Joining Date / Profile Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Joining Date
          </label>
          <input
            type="date"
            value={new Date().toISOString().split("T")[0]}
            onBlur={blur("joining_date")}
            className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            readOnly={true}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Profile Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Clinic Address
        </label>
        <textarea
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          onBlur={blur("address_line")}
          className={`w-full py-2.5 bg-slate-50 border ${borderCls("address_line")} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          rows={2}
          placeholder="Enter complete clinic address"
        />
        <FieldError name="address_line" errors={fieldErrors} touched={touched} />
      </div>

      {/* Pincode / City / State */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <input
            value={pincode}
            maxLength={6}
            onBlur={blur("pincode")}
            onChange={async (e) => {
              const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
              setPincode(raw);
              if (raw.length === 6) {
                try {
                  const res = await axios.get(
                    `https://api.postalpincode.in/pincode/${raw}`
                  );
                  if (res?.data[0]?.Status === "Success") {
                    const state = res?.data[0]?.PostOffice[0]?.State;
                    const district = res?.data[0]?.PostOffice[0]?.District;
                    if (state) setStateName(state);
                    if (district) setCity(district);
                  }
                } catch {
                  // silent fail
                }
              }
              if (raw.length === 0) {
                setStateName("");
                setCity("");
              }
            }}
            placeholder="Pincode"
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "pincode"
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          />
          <FieldError name="pincode" errors={fieldErrors} touched={touched} />
        </div>
        <div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onBlur={blur("city")}
            placeholder="City"
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "city"
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          />
          <FieldError name="city" errors={fieldErrors} touched={touched} />
        </div>
        <div>
          <input
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            onBlur={blur("state")}
            placeholder="State"
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "state"
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          />
          <FieldError name="state" errors={fieldErrors} touched={touched} />
        </div>
      </div>

      {/* Qualifications */}
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">Qualifications</p>
          <button
            type="button"
            onClick={addQualification}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {qualifications.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-2">
            No qualifications added.
          </p>
        )}
        <div className="space-y-2">
          {qualifications.map((q, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-100"
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
                className="col-span-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs px-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Qualification</option>
                {qualificationOptions.map((qual) => (
                  <option
                    key={qual.qualification_id}
                    value={qual.qualification_id}
                  >
                    {qual.qualification_name} ({qual.qualification_code})
                  </option>
                ))}
              </select>
              <input
                value={q.institution || ""}
                onChange={(e) =>
                  updateQualification(idx, "institution", e.target.value)
                }
                placeholder="Institution"
                className="col-span-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs px-2 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                value={q.year_of_completion || ""}
                onChange={(e) =>
                  updateQualification(idx, "year_of_completion", e.target.value)
                }
                placeholder="Year"
                min={1950}
                max={new Date().getFullYear()}
                className="col-span-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs px-2 focus:outline-none focus:border-emerald-500"
              />
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => removeQualification(idx)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
