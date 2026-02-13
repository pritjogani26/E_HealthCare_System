import React, { useEffect, useState } from "react";
import {
  Eye,
  UserCheck,
  UserX,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Activity
} from "lucide-react";
import toast from "react-hot-toast";
import { Layout } from "../components/common/Layout";
import { PageHeader } from "../components/common/PageHeader";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { StatusBadge } from "../components/common/StatusBadge";
import { Pagination } from "../components/common/Pagination";
import { Modal } from "../components/common/Modal";
import { InfoRow } from "../components/common/InfoRow";
import { apiService, handleApiError } from "../services/api";
import { PatientProfile } from "../types";

const AdminPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllPatients();
      setPatients(data);
      setError(null);
    } catch (e) {
      console.error("Failed to load patients", e);
      setError("Unable to load patients list.");
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (patient: PatientProfile) => {
    try {
      setActionLoading(true);
      const updatedPatient = await apiService.togglePatientStatus(patient.patient_id);

      // Update the patient in the list
      setPatients(prev =>
        prev.map(p => p.patient_id === patient.patient_id ? updatedPatient : p)
      );

      // Update selected patient if it's the one being toggled
      if (selectedPatient?.patient_id === patient.patient_id) {
        setSelectedPatient(updatedPatient);
      }

      toast.success(
        updatedPatient.is_active
          ? "Patient activated successfully"
          : "Patient deactivated successfully"
      );
    } catch (e) {
      const message = handleApiError(e);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const viewPatientDetails = (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setSelectedPatient(null);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = patients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(patients.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Layout>
      <PageHeader
        title="Patients Management"
        description="View and manage all registered patients in the system."
      />

      {loading && <LoadingState message="Loading patients..." />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">No.</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Patient Name</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Mobile</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPatients.map((patient, index) => (
                  <tr
                    key={patient.patient_id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-600">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {patient.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {patient.user.email}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {patient.mobile}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge type="active" status={patient.is_active} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewPatientDetails(patient)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(patient)}
                          disabled={actionLoading}
                          className={`p-1.5 rounded-lg transition-colors ${patient.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          title={patient.is_active ? "Deactivate" : "Activate"}
                        >
                          {patient.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentPatients.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 px-4 text-center text-slate-500"
                    >
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={patients.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            indexOfFirstItem={indexOfFirstItem}
            indexOfLastItem={indexOfLastItem}
          />
        </div>
      )}

      {/* Patient Details Modal */}
      <Modal
        isOpen={isDetailOpen && selectedPatient !== null}
        onClose={closeDetails}
        title="Patient Details"
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-semibold">
                {selectedPatient.full_name[0]}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-900">{selectedPatient.full_name}</h4>
                <p className="text-sm text-slate-600 mt-1">Patient ID: {selectedPatient.patient_id}</p>
              </div>
              <button
                onClick={() => handleToggleStatus(selectedPatient)}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPatient.is_active
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
              >
                {selectedPatient.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>

            {/* Details Grid */}
            <div>
              <h5 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-emerald-600" />
                Patient Information
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon={UserIcon} label="Full Name" value={selectedPatient.full_name} />
                <InfoRow icon={Mail} label="Email" value={selectedPatient.user.email} />
                <InfoRow icon={Phone} label="Mobile" value={selectedPatient.mobile} />
                <InfoRow
                  icon={Calendar}
                  label="Date of Birth"
                  value={selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : null}
                />
                <InfoRow icon={UserIcon} label="Gender" value={selectedPatient.gender_details?.gender_value} />
                <InfoRow
                  icon={Activity}
                  label="Blood Group"
                  value={selectedPatient.blood_group_details?.blood_group_value}
                />
                <InfoRow
                  icon={UserIcon}
                  label="Emergency Contact"
                  value={selectedPatient.emergency_contact_name}
                />
                <InfoRow
                  icon={Phone}
                  label="Emergency Phone"
                  value={selectedPatient.emergency_contact_phone}
                />
              </div>
            </div>

            {/* Address */}
            {selectedPatient.address && (
              <div>
                <h5 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Address Information
                </h5>
                <InfoRow
                  icon={MapPin}
                  label="Complete Address"
                  value={`${selectedPatient.address}${selectedPatient.city ? ', ' + selectedPatient.city : ''}${selectedPatient.state ? ', ' + selectedPatient.state : ''}${selectedPatient.pincode ? ' - ' + selectedPatient.pincode : ''}`}
                />
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
                  value={selectedPatient.is_active ? "Active" : "Inactive"}
                />
                <InfoRow
                  icon={Activity}
                  label="Email Verified"
                  value={selectedPatient.user.email_verified ? "Yes" : "No"}
                />
                <InfoRow
                  icon={Calendar}
                  label="Account Created"
                  value={new Date(selectedPatient.created_at).toLocaleString()}
                />
                <InfoRow
                  icon={Calendar}
                  label="Last Updated"
                  value={new Date(selectedPatient.updated_at).toLocaleString()}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AdminPatientsPage;
