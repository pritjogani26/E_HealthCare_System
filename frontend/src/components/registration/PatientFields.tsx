// frontend/src/components/registration/PatientFields.tsx
import React from "react";
import { User, Calendar, Phone, AlertCircle } from "lucide-react";
import { BloodGroup, Gender } from "../../types";
import axios from "axios";

interface PatientFieldsProps {
  fullName: string;
  setFullName: (v: string) => void;
  dateOfBirth: string | null;
  setDateOfBirth: (v: string | null) => void;
  genderId: number | null;
  setGenderId: (v: number | null) => void;
  bloodGroup: number | null;
  setBloodGroup: (v: number | null) => void;
  mobile: string;
  setMobile: (v: string) => void;
  emergencyName: string;
  setEmergencyName: (v: string) => void;
  emergencyPhone: string;
  setEmergencyPhone: (v: string) => void;
  addressLine: string;
  setAddressLine: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  stateName: string;
  setStateName: (v: string) => void;
  pincode: string;
  setPincode: (v: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  genderOptions: Gender[];
  bloodGroupOptions: BloodGroup[];
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

export const PatientFields: React.FC<PatientFieldsProps> = ({
  fullName,
  setFullName,
  dateOfBirth,
  setDateOfBirth,
  genderId,
  setGenderId,
  bloodGroup,
  setBloodGroup,
  mobile,
  setMobile,
  emergencyName,
  setEmergencyName,
  emergencyPhone,
  setEmergencyPhone,
  addressLine,
  setAddressLine,
  city,
  setCity,
  stateName,
  setStateName,
  pincode,
  setPincode,
  handleFileChange,
  genderOptions,
  bloodGroupOptions,
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
            id="pt-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={blur("full_name")}
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${borderCls(
              "full_name"
            )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
            placeholder="e.g. Rahul Sharma"
          />
        </div>
        <FieldError name="full_name" errors={fieldErrors} touched={touched} />
      </div>

      {/* DOB / Gender / Blood Group */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Date of Birth
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateOfBirth ?? ""}
              onChange={(e) => setDateOfBirth(e.target.value || null)}
              onBlur={blur("date_of_birth")}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${borderCls(
                "date_of_birth"
              )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
            />
          </div>
          <FieldError name="date_of_birth" errors={fieldErrors} touched={touched} />
        </div>

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
              "gender_id"
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
            Blood Group
          </label>
          <select
            value={bloodGroup ?? ""}
            onChange={(e) =>
              setBloodGroup(e.target.value ? Number(e.target.value) : null)
            }
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "blood_group_id"
            )} rounded-lg text-sm pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          >
            <option value="">Select Blood Group</option>
            {bloodGroupOptions.map((bg) => (
              <option key={bg.blood_group_id} value={bg.blood_group_id}>
                {bg.blood_group_value}
              </option>
            ))}
          </select>
          <FieldError name="blood_group_id" errors={fieldErrors} touched={touched} />
        </div>
      </div>

      {/* Mobile / Emergency Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Mobile <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="pt-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onBlur={blur("mobile")}
              maxLength={10}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${borderCls(
                "mobile"
              )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
              placeholder="10-digit mobile number"
            />
          </div>
          <FieldError name="mobile" errors={fieldErrors} touched={touched} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Emergency Contact Name
          </label>
          <input
            type="text"
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
            className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            placeholder="Name"
          />
        </div>
      </div>

      {/* Emergency Phone / Profile Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Emergency Contact Phone
          </label>
          <input
            type="tel"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            onBlur={blur("emergency_contact_phone")}
            maxLength={10}
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "emergency_contact_phone"
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
            placeholder="10-digit phone number"
          />
          <FieldError name="emergency_contact_phone" errors={fieldErrors} touched={touched} />
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
          Address
        </label>
        <textarea
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          rows={2}
          placeholder="Enter complete address"
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
            placeholder="State"
            className={`w-full py-2.5 bg-slate-50 border ${borderCls(
              "state"
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          />
          <FieldError name="state" errors={fieldErrors} touched={touched} />
        </div>
      </div>
    </div>
  );
};
