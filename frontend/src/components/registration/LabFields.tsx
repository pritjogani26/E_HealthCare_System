import React from 'react';
import { Building2, FileText, Phone } from 'lucide-react';

interface LabFieldsProps {
    labName: string;
    setLabName: (val: string) => void;
    licenseNumber: string;
    setLicenseNumber: (val: string) => void;
    labPhone: string;
    setLabPhone: (val: string) => void;
    address: string;
    setAddress: (val: string) => void;
    city: string;
    setCity: (val: string) => void;
    stateName: string;
    setStateName: (val: string) => void;
    pincode: string;
    setPincode: (val: string) => void;
    operatingHoursText: string;
    setOperatingHoursText: (val: string) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LabFields: React.FC<LabFieldsProps> = ({
    labName, setLabName,
    licenseNumber, setLicenseNumber,
    labPhone, setLabPhone,
    address, setAddress,
    city, setCity,
    stateName, setStateName,
    pincode, setPincode,
    operatingHoursText, setOperatingHoursText,
    handleFileChange
}) => {
    return (
        <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Lab Name
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={labName}
                            onChange={(e) => setLabName(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            placeholder="e.g. City Pathlabs"
                        />
                    </div>
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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>
            </div>

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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Lab Logo
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all"
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
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    rows={2}
                    placeholder="Lab Address"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <input
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="State"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Operating Hours (JSON format)
                </label>
                <textarea
                    value={operatingHoursText}
                    onChange={(e) => setOperatingHoursText(e.target.value)}
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    rows={3}
                />
                <p className="text-xs text-slate-500 mt-1">
                    Edit defaults or provide valid JSON.
                </p>
            </div>
        </div>
    );
};
