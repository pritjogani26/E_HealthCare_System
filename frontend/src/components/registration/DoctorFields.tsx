import React from 'react';
import { User, Plus, Trash2 } from 'lucide-react';
import { Gender, Qualification } from '../../types';

interface DoctorFieldsProps {
    fullName: string;
    setFullName: (val: string) => void;
    genderId: number | null;
    setGenderId: (val: number | null) => void;
    experienceYears: string;
    setExperienceYears: (val: string) => void;
    consultationFee: string;
    setConsultationFee: (val: string) => void;
    phone: string;
    setPhone: (val: string) => void;
    registrationNumber: string;
    setRegistrationNumber: (val: string) => void;
    joiningDate: string | null;
    setJoiningDate: (val: string | null) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    qualifications: {
        qualification_id: number | null;
        institution?: string;
        year_of_completion?: string;
    }[];
    addQualification: () => void;
    updateQualification: (index: number, key: string, value: string | number) => void;
    removeQualification: (index: number) => void;
    genderOptions: Gender[];
    qualificationOptions: Qualification[];
}

export const DoctorFields: React.FC<DoctorFieldsProps> = ({
    fullName, setFullName,
    genderId, setGenderId,
    experienceYears, setExperienceYears,
    consultationFee, setConsultationFee,
    phone, setPhone,
    registrationNumber, setRegistrationNumber,
    joiningDate, setJoiningDate,
    handleFileChange,
    qualifications, addQualification, updateQualification, removeQualification,
    genderOptions, qualificationOptions
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
                        placeholder="Dr. Name"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Gender
                    </label>
                    <select
                        value={genderId ?? ""}
                        onChange={(e) => setGenderId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                        <option value="">Select gender</option>
                        {genderOptions.map((g) => (
                            <option key={g.gender_id} value={g.gender_id}>
                                {g.gender_value}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Experience (years)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Consultation fee
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(e.target.value)}
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        placeholder="e.g. 500.00"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Phone number
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Registration number
                    </label>
                    <input
                        type="text"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Joining date
                    </label>
                    <input
                        type="date"
                        value={joiningDate ?? ""}
                        onChange={(e) => setJoiningDate(e.target.value || null)}
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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

            {/* Qualifications subform */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-slate-700">
                        Qualifications
                    </div>
                    <button
                        type="button"
                        onClick={addQualification}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>

                {qualifications.length === 0 && (
                    <div className="text-xs text-slate-500 italic text-center py-2">
                        No qualifications added yet.
                    </div>
                )}

                <div className="space-y-3">
                    {qualifications.map((q, idx) => (
                        <div
                            key={idx}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm"
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
                                className="sm:col-span-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm px-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            >
                                <option value="">Qualification</option>
                                {qualificationOptions.map((qual) => (
                                    <option key={qual.qualification_id} value={qual.qualification_id}>
                                        {qual.qualification_name} ({qual.qualification_code})
                                    </option>
                                ))}
                            </select>
                            <input
                                value={q.institution || ""}
                                onChange={(e) =>
                                    updateQualification(
                                        idx,
                                        "institution",
                                        e.target.value,
                                    )
                                }
                                placeholder="Institution"
                                className="sm:col-span-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm px-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <input
                                type="number"
                                value={q.year_of_completion || ""}
                                onChange={(e) =>
                                    updateQualification(
                                        idx,
                                        "year_of_completion",
                                        e.target.value,
                                    )
                                }
                                placeholder="Year"
                                className="sm:col-span-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm px-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <div className="sm:col-span-1 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => removeQualification(idx)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
