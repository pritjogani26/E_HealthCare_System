import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Stethoscope, FlaskConical, CheckCircle } from 'lucide-react';

const RoleSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const googleData = location.state?.googleData; // Should be present

    const handleSelectRole = (role: 'PATIENT' | 'DOCTOR' | 'LAB') => {
        navigate('/registration', { state: { role, googleData } });
    };

    React.useEffect(() => {
        if (!googleData) {
            // Direct access not allowed, go to login
            navigate('/');
        }
    }, [googleData, navigate]);

    if (!googleData) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Complete Your Profile</h1>
                <p className="text-slate-600">Please select your account type to proceed.</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-green-600 bg-green-50 py-2 px-4 rounded-full w-fit mx-auto border border-green-100">
                    <CheckCircle size={20} />
                    <span className="font-medium">Verified: {googleData.email}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
                <RoleCard
                    title="Patient"
                    description="Book appointments and manage your health records."
                    icon={<User size={40} />}
                    onClick={() => handleSelectRole('PATIENT')}
                />
                <RoleCard
                    title="Doctor"
                    description="Manage appointments, patients and prescriptions."
                    icon={<Stethoscope size={40} />}
                    onClick={() => handleSelectRole('DOCTOR')}
                />
                <RoleCard
                    title="Lab"
                    description="Manage lab tests and reports."
                    icon={<FlaskConical size={40} />}
                    onClick={() => handleSelectRole('LAB')}
                />
            </div>
        </div>
    );
};

const RoleCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void }> = ({ title, description, icon, onClick }) => (
    <button
        onClick={onClick}
        className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col items-center text-center h-full"
    >
        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </button>
);

export default RoleSelectionPage;
