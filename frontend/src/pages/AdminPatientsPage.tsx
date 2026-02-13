import React, { useEffect, useState } from "react";
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
  MapPin,
  Calendar,
  Heart,
  Activity
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService, handleApiError } from "../services/api";
import { PatientProfile } from "../types";

const AdminPatientsPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
            <h2 className="text-3xl font-bold text-slate-800 mb-1">Patients Management</h2>
            <p className="text-slate-600 text-sm">
              View and manage all registered patients in the system.
            </p>
          </div>

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-sm text-slate-600">Loading patients...</div>
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
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                                }`}
                            >
                              {patient.is_active ? "Active" : "Inactive"}
                            </span>
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
                {totalPages > 1 && (
                  <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, patients.length)} of {patients.length} patients
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

      {/* Patient Details Modal */}
      {isDetailOpen && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">Patient Details</h3>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPatientsPage;
