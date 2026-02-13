import React from 'react';

interface RoleSelectorProps {
    role: 'PATIENT' | 'DOCTOR' | 'LAB';
    onChange: (role: 'PATIENT' | 'DOCTOR' | 'LAB') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ role, onChange }) => {
    return (
        <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
                {(['PATIENT', 'DOCTOR', 'LAB'] as const).map((r) => (
                    <button
                        key={r}
                        type="button"
                        onClick={() => onChange(r)}
                        className={`px-4 py-2 rounded-lg cursor-pointer select-none transition-colors font-medium text-sm ${role === r
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                            }`}
                    >
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>
        </div>
    );
};
