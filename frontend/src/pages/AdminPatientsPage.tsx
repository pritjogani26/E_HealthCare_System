// frontend/src/pages/AdminPatientsPage.tsx
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
  Activity,
  Droplets,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/common/Layout";
import { PageHeader } from "../components/common/PageHeader";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { StatusBadge } from "../components/common/StatusBadge";
import { Pagination } from "../components/common/Pagination";
import { Modal } from "../components/common/Modal";
import { ActionConfirmationModal } from "../components/common/ActionConfirmationModal";

import { InfoRow } from "../components/common/InfoRow";
import { handleApiError } from "../services/api";
import { getAllPatients, togglePatientStatus } from "../services/admin_api";
import { PatientList, PatientProfile } from "../types";

const AdminPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<PatientList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientList | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canToggle = hasPermission("patient : toggle_status");

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionData, setActionData] = useState<{
    type: "TOGGLE";
    target: PatientList | null;
  }>({ type: "TOGGLE", target: null });

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPatients();
      setPatients(data);
      console.log(data);
    } catch (e) {
      setError("Unable to load patients list.");
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRequest = (patient: PatientList) => {
    setActionData({ type: "TOGGLE", target: patient });
    setActionModalOpen(true);
  };

  const handleToggleConfirm = async (reason: string) => {
    const patient = actionData.target;
    if (!patient) return;
    try {
      setActionLoading(true);
      const updated = await togglePatientStatus(patient.patient_id, reason);
      setPatients((prev) =>
        prev.map((p) => (p.patient_id === patient.patient_id ? updated : p)),
      );
      if (selectedPatient?.patient_id === patient.patient_id)
        setSelectedPatient(updated);
      toast.success(
        updated.is_active ? "Patient activated" : "Patient deactivated",
      );
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setActionLoading(false);
      setActionModalOpen(false);
    }
  };

  const handleModalConfirm = (reason: string) => {
    handleToggleConfirm(reason);
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentPatients = patients.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(patients.length / itemsPerPage);

  return (
    <Layout>
      <PageHeader
        title="Patients Management"
        description="View and manage all registered patients."
      />

      {loading && <LoadingState message="Loading patients…" />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                    No.
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                    Mobile
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPatients.map((patient, idx) => (
                  <tr
                    key={patient.patient_id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-500">
                      {indexOfFirst + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {patient.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {patient.email}
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
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canToggle && (
                          <button
                            onClick={() => handleToggleRequest(patient)}
                            disabled={actionLoading}
                            className={`p-1.5 rounded-lg transition-colors ${patient.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                            title={patient.is_active ? "Deactivate" : "Activate"}
                          >
                            {patient.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {currentPatients.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-slate-400"
                    >
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={patients.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            indexOfFirstItem={indexOfFirst}
            indexOfLastItem={indexOfLast}
          />
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen && !!selectedPatient}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPatient(null);
        }}
        title="Patient Details"
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                {selectedPatient.full_name[0]}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedPatient.full_name}
                </h4>
                <p className="text-sm text-slate-500">
                  Patient ID: {selectedPatient.patient_id}
                </p>
              </div>
              {canToggle && (
                <button
                  onClick={() => handleToggleRequest(selectedPatient)}
                  disabled={actionLoading}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedPatient.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                >
                  {selectedPatient.is_active ? "Deactivate" : "Activate"}
                </button>
              )}
            </div>

            <div>
              <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-600" /> Patient
                Information
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                  icon={UserIcon}
                  label="Full Name"
                  value={selectedPatient.full_name}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={selectedPatient.email}
                />
                <InfoRow
                  icon={Phone}
                  label="Mobile"
                  value={selectedPatient.mobile}
                />
                <InfoRow
                  icon={UserIcon}
                  label="Gender"
                  value={selectedPatient.gender}
                />
                <InfoRow
                  icon={Droplets}
                  label="Blood Group"
                  value={selectedPatient.blood_group}
                />
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" /> Account
                Details
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                  icon={Activity}
                  label="Account Status"
                  value={selectedPatient.is_active ? "Active" : "Inactive"}
                />
                <InfoRow
                  icon={Calendar}
                  label="Joined"
                  value={new Date(selectedPatient.created_at).toLocaleString()}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ActionConfirmationModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onConfirm={handleModalConfirm}
        title={
          actionData.target?.is_active
            ? "Deactivate Patient"
            : "Activate Patient"
        }
        message={
          actionData.target?.is_active
            ? `Are you sure you want to deactivate patient ${actionData.target.full_name} ?`
            : `Are you sure you want to activate patient ${actionData.target?.full_name} ?`
        }
        requireReason={true}
        reasonLabel={"Reason for status change"}
        confirmLabel={actionData.target?.is_active ? "Deactivate" : "Activate"}
        loading={actionLoading}
      />
    </Layout>
  );
};

export default AdminPatientsPage;
