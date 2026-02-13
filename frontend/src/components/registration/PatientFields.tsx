import React from 'react';
import { User, Calendar, Phone } from 'lucide-react';
import { BloodGroup, Gender } from '../../types';

interface PatientFieldsProps {
    fullName: string;
    setFullName: (val: string) => void;
    dateOfBirth: string | null;
    setDateOfBirth: (val: string | null) => void;
    genderId: number | null;
    setGenderId: (val: number | null) => void;
    bloodGroup: number | null;
    setBloodGroup: (val: number | null) => void;
    mobile: string;
    setMobile: (val: string) => void;
    emergencyName: string;
    setEmergencyName: (val: string) => void;
    emergencyPhone: string;
    setEmergencyPhone: (val: string) => void;
    address: string;
    setAddress: (val: string) => void;
    city: string;
    setCity: (val: string) => void;
    stateName: string;
    setStateName: (val: string) => void;
    pincode: string;
    setPincode: (val: string) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    genderOptions: Gender[];
    bloodGroupOptions: BloodGroup[];
}

export const PatientFields: React.FC<PatientFieldsProps> = ({
    fullName, setFullName,
    dateOfBirth, setDateOfBirth,
    genderId, setGenderId,
    bloodGroup, setBloodGroup,
    mobile, setMobile,
    emergencyName, setEmergencyName,
    emergencyPhone, setEmergencyPhone,
    address, setAddress,
    city, setCity,
    stateName, setStateName,
    pincode, setPincode,
    handleFileChange,
    genderOptions, bloodGroupOptions
}) => {
    return (
        <div className="space-y-4 animate-fadeIn">
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                    placeholder="Enter complete address"
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
        </div>
    );
};
