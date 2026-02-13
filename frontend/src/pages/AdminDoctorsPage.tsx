import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Eye,
  UserCheck,
  UserX,
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
  X
} from "lucide-react";
import toast from "react-hot-toast";
import { Layout } from "../components/common/Layout";
import { PageHeader } from "../components/common/PageHeader";
import { FilterTabs } from "../components/common/FilterTabs";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { StatusBadge } from "../components/common/StatusBadge";
import { Pagination } from "../components/common/Pagination";
import { Modal } from "../components/common/Modal";
import { InfoRow } from "../components/common/InfoRow";
import { apiService, handleApiError } from "../services/api";
import { DoctorProfile } from "../types";

const AdminDoctorsPage: React.FC = () => {
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

  return (
    <Layout>
      <PageHeader
        title="Doctors Management"
        description="View and manage all registered doctors in the system."
      />

      {/* Filter Tabs */}
      <FilterTabs
        tabs={[
          { id: 'ALL', label: 'All Doctors' },
          { id: 'PENDING', label: 'Pending Approval' },
          { id: 'VERIFIED', label: 'Verified' },
          { id: 'REJECTED', label: 'Rejected' },
        ]}
        activeTab={filterStatus}
        onTabChange={(id) => {
          setFilterStatus(id as any);
          setCurrentPage(1);
        }}
      />

      {loading && <LoadingState message="Loading doctors..." />}

      {!loading && error && <ErrorState message={error} />}

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
                        <StatusBadge
                          status={doctor.verification_status}
                          label={doctor.verification_status_display}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          type="active"
                          status={doctor.is_active}
                        />
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
                        colSpan={7}
                        className="py-8 px-4 text-center text-slate-500"
                      >
                        No doctors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDoctors.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              indexOfFirstItem={indexOfFirstItem}
              indexOfLastItem={indexOfLastItem}
            />
          </div>
        </>
      )}

      {/* Doctor Details Modal */}
      <Modal
        isOpen={isDetailOpen && selectedDoctor !== null}
        onClose={closeDetails}
        title="Doctor Details"
      >
        {selectedDoctor && (
          <div className="space-y-6">
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
        )}
      </Modal>
    </Layout>
  );
};

export default AdminDoctorsPage;
