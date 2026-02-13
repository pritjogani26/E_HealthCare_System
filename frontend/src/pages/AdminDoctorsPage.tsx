import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCheck,
  UserX,
  X,
  User as UserIcon,
  Mail,
  Phone,
  Award,
  Calendar,
  Stethoscope,
  Activity,
  FileText,
  Shield,
  Check,
  AlertCircle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService, handleApiError } from "../services/api";
import { DoctorProfile } from "../types";

const AdminDoctorsPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    if (statusParam === 'PENDING') {
      setFilterStatus('PENDING');
    }
    loadDoctors();
  }, [location.search]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllDoctors();
      setDoctors(data);
      setError(null);
    } catch (e) {
      console.error("Failed to load doctors", e);
      setError("Unable to load doctors list.");
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (doctor: DoctorProfile) => {
    try {
      setActionLoading(true);
      const updatedDoctor = await apiService.toggleDoctorStatus(doctor.user.user_id);

      // Update the doctor in the list
      setDoctors(prev =>
        prev.map(d => d.user.user_id === doctor.user.user_id ? updatedDoctor : d)
      );

      // Update selected doctor if it's the one being toggled
      if (selectedDoctor?.user.user_id === doctor.user.user_id) {
        setSelectedDoctor(updatedDoctor);
      }

      toast.success(
        updatedDoctor.is_active
          ? "Doctor activated successfully"
          : "Doctor deactivated successfully"
      );
    } catch (e) {
      const message = handleApiError(e);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctor: DoctorProfile, status: 'VERIFIED' | 'REJECTED') => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this doctor?`)) return;

    try {
      setActionLoading(true);
      const updatedDoctor = await apiService.verifyDoctor(doctor.user.user_id, status);

      setDoctors(prev =>
        prev.map(d => d.user.user_id === doctor.user.user_id ? updatedDoctor : d)
      );

      if (selectedDoctor?.user.user_id === doctor.user.user_id) {
        setSelectedDoctor(updatedDoctor);
      }

      toast.success(`Doctor ${status.toLowerCase()} successfully`);
    } catch (e) {
      const message = handleApiError(e);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const viewDoctorDetails = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setSelectedDoctor(null);
  };

  // Pagination logic
  // Filter and Pagination logic
  const filteredDoctors = doctors.filter(doctor => {
    if (filterStatus === 'ALL') return true;
    return doctor.verification_status === filterStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Info display component
  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: any }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
        <Icon className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
          <p className="text-sm text-slate-800 font-medium break-words">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
          },
        }}
      />
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="lg:pl-72">
        <Header setIsSidebarOpen={setIsSidebarOpen} />
        <main className="p-6 min-h-[calc(100vh-73px)] flex flex-col">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-1">Doctors Management</h2>
            <p className="text-slate-600 text-sm">
              View and manage all registered doctors in the system.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'ALL', label: 'All Doctors' },
              { id: 'PENDING', label: 'Pending Approval' },
              { id: 'VERIFIED', label: 'Verified' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterStatus(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-sm text-slate-600">Loading doctors...</div>
            </div>
          )}

          {!loading && error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                {error}
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-slate-700 font-semibold">No.</th>
                        <th className="text-left py-3 px-4 text-slate-700 font-semibold">Doctor Name</th>
                        <th className="text-left py-3 px-4 text-slate-700 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 text-slate-700 font-semibold">Phone</th>
                        <th className="text-left py-3 px-4 text-slate-700 font-semibold">Verification</th>
                        <th className="text-left py-3 px-4 text-slate-700 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-slate-700 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDoctors.map((doctor, index) => (
                        <tr
                          key={doctor.user.user_id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-600">
                            {indexOfFirstItem + index + 1}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {doctor.full_name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {doctor.user.email}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {doctor.phone_number}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${doctor.verification_status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' :
                                doctor.verification_status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                  doctor.verification_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                    'bg-slate-100 text-slate-800'
                                }`}
                            >
                              {doctor.verification_status === 'PENDING' && <AlertCircle className="w-3 h-3" />}
                              {doctor.verification_status_display}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doctor.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                                }`}
                            >
                              {doctor.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewDoctorDetails(doctor)}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {doctor.verification_status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleVerifyDoctor(doctor, 'VERIFIED')}
                                    disabled={actionLoading}
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleVerifyDoctor(doctor, 'REJECTED')}
                                    disabled={actionLoading}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleToggleStatus(doctor)}
                                disabled={actionLoading}
                                className={`p-1.5 rounded-lg transition-colors ${doctor.is_active
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  }`}
                                title={doctor.is_active ? "Deactivate" : "Activate"}
                              >
                                {doctor.is_active ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {currentDoctors.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 px-4 text-center text-slate-500"
                          >
                            No doctors found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredDoctors.length)} of {filteredDoctors.length} doctors
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                            ? "bg-emerald-500 text-white"
                            : "bg-white border border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
        <Footer />
      </div>

      {/* Doctor Details Modal */}
      {isDetailOpen && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">Doctor Details</h3>
              <button
                onClick={closeDetails}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {selectedDoctor.full_name[0]}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-slate-900">{selectedDoctor.full_name}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedDoctor.registration_number} • {selectedDoctor.verification_status_display}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleStatus(selectedDoctor)}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedDoctor.is_active
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                >
                  {selectedDoctor.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>

              {/* Details Grid */}
              <div>
                <h5 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                  Doctor Information
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={UserIcon} label="Full Name" value={selectedDoctor.full_name} />
                  <InfoRow icon={Mail} label="Email" value={selectedDoctor.user.email} />
                  <InfoRow icon={Phone} label="Phone Number" value={selectedDoctor.phone_number} />
                  <InfoRow
                    icon={UserIcon}
                    label="Gender"
                    value={selectedDoctor.gender_details?.gender_value}
                  />
                  <InfoRow
                    icon={FileText}
                    label="Registration Number"
                    value={selectedDoctor.registration_number}
                  />
                  <InfoRow
                    icon={Award}
                    label="Experience"
                    value={`${selectedDoctor.experience_years} years`}
                  />
                  <InfoRow
                    icon={Activity}
                    label="Consultation Fee"
                    value={selectedDoctor.consultation_fee ? `₹${selectedDoctor.consultation_fee}` : null}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Joining Date"
                    value={selectedDoctor.joining_date ? new Date(selectedDoctor.joining_date).toLocaleDateString() : null}
                  />
                  <InfoRow
                    icon={Shield}
                    label="Verification Status"
                    value={selectedDoctor.verification_status_display}
                  />
                  {selectedDoctor.verified_at && (
                    <InfoRow
                      icon={Calendar}
                      label="Verified At"
                      value={new Date(selectedDoctor.verified_at).toLocaleString()}
                    />
                  )}
                </div>
              </div>

              {/* Qualifications */}
              {selectedDoctor.qualifications && selectedDoctor.qualifications.length > 0 && (
                <div>
                  <h5 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Qualifications
                  </h5>
                  <div className="space-y-3">
                    {selectedDoctor.qualifications.map((qual, idx) => (
                      <div key={idx} className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h6 className="font-semibold text-slate-900 mb-2">
                          {qual.qualification_details?.qualification_name} ({qual.qualification_details?.qualification_code})
                        </h6>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p><span className="font-medium">Institution:</span> {qual.institution}</p>
                          <p><span className="font-medium">Year:</span> {qual.year_of_completion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Info */}
              <div>
                <h5 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Account Information
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow
                    icon={Activity}
                    label="Account Status"
                    value={selectedDoctor.is_active ? "Active" : "Inactive"}
                  />
                  <InfoRow
                    icon={Activity}
                    label="Email Verified"
                    value={selectedDoctor.user.email_verified ? "Yes" : "No"}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Account Created"
                    value={new Date(selectedDoctor.created_at).toLocaleString()}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Last Updated"
                    value={new Date(selectedDoctor.updated_at).toLocaleString()}
                  />
                </div>
              </div>

              {/* Verification Notes */}
              {selectedDoctor.verification_notes && (
                <div>
                  <h5 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Verification Notes
                  </h5>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700">{selectedDoctor.verification_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctorsPage;
