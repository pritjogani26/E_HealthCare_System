// frontend/src/components/registration/LabFields.tsx
import React from "react";
import { Building2, FileText, Phone, AlertCircle } from "lucide-react";
import axios from "axios";

interface LabFieldsProps {
  labName: string;
  setLabName: (v: string) => void;
  licenseNumber: string;
  setLicenseNumber: (v: string) => void;
  labPhone: string;
  setLabPhone: (v: string) => void;
  addressLine: string;
  setAddressLine: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  stateName: string;
  setStateName: (v: string) => void;
  pincode: string;
  setPincode: (v: string) => void;
  operatingHoursText: string;
  setOperatingHoursText: (v: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

export const LabFields: React.FC<LabFieldsProps> = ({
  labName,
  setLabName,
  licenseNumber,
  setLicenseNumber,
  labPhone,
  setLabPhone,
  addressLine,
  setAddressLine,
  city,
  setCity,
  stateName,
  setStateName,
  pincode,
  setPincode,
  operatingHoursText,
  setOperatingHoursText,
  handleFileChange,
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
      {/* Lab Name / License Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Lab Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              onBlur={blur("lab_name")}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${borderCls(
                "lab_name"
              )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
              placeholder="e.g. City Pathlabs"
            />
          </div>
          <FieldError name="lab_name" errors={fieldErrors} touched={touched} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            License Number
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${borderCls(
                "license_number"
              )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
              placeholder="e.g. LIC-2024-XXXXX"
            />
          </div>
          <FieldError name="license_number" errors={fieldErrors} touched={touched} />
        </div>
      </div>

      {/* Phone / Logo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={labPhone}
              onChange={(e) => setLabPhone(e.target.value)}
              onBlur={blur("phone_number")}
              maxLength={10}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${borderCls(
                "phone_number"
              )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
              placeholder="10-digit phone number"
            />
          </div>
          <FieldError name="phone_number" errors={fieldErrors} touched={touched} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Lab Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>
      </div>

      {/* Address Line */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Address Line
        </label>
        <textarea
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          onBlur={blur("address_line")}
          className={`w-full py-2.5 bg-slate-50 border ${borderCls(
            "address_line"
          )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
          rows={2}
          placeholder="Street address, building, floor…"
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
                  if (res?.data?.[0]?.Status === "Success") {
                    const state = res?.data[0]?.PostOffice?.[0]?.State;
                    const district = res?.data[0]?.PostOffice?.[0]?.District;
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
            )} rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
          />
          <FieldError name="pincode" errors={fieldErrors} touched={touched} />
        </div>
        <div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div>
          <input
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            placeholder="State"
            className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Operating Hours */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Operating Hours{" "}
          <span className="text-slate-400 font-normal text-xs">
            (JSON: day → "HH:MM-HH:MM")
          </span>
        </label>
        <textarea
          value={operatingHoursText}
          onChange={(e) => setOperatingHoursText(e.target.value)}
          className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          rows={3}
        />
        <p className="text-xs text-slate-400 mt-1">
          Example:{" "}
          <code>{`{"monday":"09:00-18:00","saturday":"09:00-14:00"}`}</code>
        </p>
      </div>
    </div>
  );
};

export default LabFields;
