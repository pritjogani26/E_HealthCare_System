import React, { useState, useEffect } from "react";
import { X, Save, User, Award, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";
import { DoctorProfile, Gender } from "../../types";
import { apiService, handleApiError } from "../../services/api";

interface EditDoctorProfileProps {
    profile: DoctorProfile;
    onClose: () => void;
    onUpdate: (updatedProfile: DoctorProfile) => void;
}

export const EditDoctorProfile: React.FC<EditDoctorProfileProps> = ({
    profile,
    onClose,
    onUpdate,
}) => {
    const [loading, setLoading] = useState(false);
    const [genders, setGenders] = useState<Gender[]>([]);

    const [formData, setFormData] = useState({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
        gender_id: profile.gender_details?.gender_id || "",
        experience_years: profile.experience_years || "0",
        consultation_fee: profile.consultation_fee || "",
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const gendersData = await apiService.getGenders();
                setGenders(gendersData);
            } catch (error) {
                console.error("Failed to load genders", error);
            }
        };
        loadData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updatedProfile = await apiService.updateDoctorProfile(formData);
            toast.success("Profile updated successfully!");
            onUpdate(updatedProfile);
            onClose();
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-emerald-600" />
                        Edit Doctor Profile
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-600" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Gender
                                </label>
                                <select
                                    name="gender_id"
                                    value={formData.gender_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select Gender</option>
                                    {genders.map((gender) => (
                                        <option key={gender.gender_id} value={gender.gender_id}>
                                            {gender.gender_value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-emerald-600" />
                            Professional Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Experience (Years) *
                                </label>
                                <input
                                    type="number"
                                    name="experience_years"
                                    value={formData.experience_years}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Consultation Fee (₹)
                                </label>
                                <input
                                    type="number"
                                    name="consultation_fee"
                                    value={formData.consultation_fee}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Read-only Information */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-sm text-slate-600 mb-2">
                            <strong>Note:</strong> Registration number, qualifications, and verification status cannot be edited.
                            Please contact administrator if you need to update these fields.
                        </p>
                        <div className="text-sm text-slate-700 space-y-1">
                            <p><strong>Registration Number:</strong> {profile.registration_number}</p>
                            <p><strong>Verification Status:</strong> {profile.verification_status_display}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
