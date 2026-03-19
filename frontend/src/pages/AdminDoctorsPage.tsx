// frontend/src/pages/AdminDoctorsPage.tsx
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
  X,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/common/Layout";
import { PageHeader } from "../components/common/PageHeader";
import { FilterTabs } from "../components/common/FilterTabs";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { StatusBadge } from "../components/common/StatusBadge";
import { Pagination } from "../components/common/Pagination";
import { Modal } from "../components/common/Modal";
import { ActionConfirmationModal } from "../components/common/ActionConfirmationModal";

import { InfoRow } from "../components/common/InfoRow";
import { handleApiError } from "../services/api";
import {
  getAllDoctors,
  toggleDoctorStatus,
  verifyDoctor,
} from "../services/admin_api";
import { DoctorList } from "../types";

const AdminDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorList | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "VERIFIED" | "REJECTED"
  >("ALL");
  const toast = useToast();
  const { hasPermission } = useAuth();

  const canToggle = hasPermission("doctor : toggle_status");
  const canVerify = hasPermission("doctor : verify");

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionData, setActionData] = useState<{
    type: "TOGGLE" | "VERIFIED" | "REJECTED";
    target: DoctorList | null;
  }>({ type: "TOGGLE", target: null });

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("status") === "PENDING") setFilterStatus("PENDING");
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      setDoctors(await getAllDoctors());
    } catch (e) {
      setError("Unable to load doctors list.");
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRequest = (doctor: DoctorList) => {
    setActionData({ type: "TOGGLE", target: doctor });
    setActionModalOpen(true);
  };

  const handleToggleConfirm = async (reason: string) => {
    const doctor = actionData.target;
    if (!doctor) return;
    try {
      setActionLoading(true);
      const entityId = doctor.doctor_id || (doctor as any).user?.user_id;
      const updated = await toggleDoctorStatus(entityId, reason);

      setDoctors((prev) =>
        prev.map((l) => {
          const lId = l.doctor_id || (l as any).user?.user_id;
          if (lId === entityId) {
            return { ...l, is_active: updated.is_active } as any;
          }
          return l;
        }),
      );

      if (
        selectedDoctor &&
        (selectedDoctor.doctor_id === entityId ||
          (selectedDoctor as any).user?.user_id === entityId)
      ) {
        setSelectedDoctor({
          ...selectedDoctor,
          is_active: updated.is_active,
        } as any);
      }

      toast.success(
        updated.is_active ? "Doctor activated" : "Doctor deactivated",
      );
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setActionLoading(false);
      setActionModalOpen(false);
    }
  };

  const handleModalConfirm = (reason: string) => {
    if (actionData.type === "TOGGLE") {
      handleToggleConfirm(reason);
    } else {
      handleVerifyConfirm(reason);
    }
  };

  const handleVerifyRequest = (
    doctor: DoctorList,
    status: "VERIFIED" | "REJECTED",
  ) => {
    setActionData({ type: status, target: doctor });
    setActionModalOpen(true);
  };

  const handleVerifyConfirm = async (reason: string) => {
    const doctor = actionData.target;
    if (!doctor) return;
    const status = actionData.type as "VERIFIED" | "REJECTED";
    const entityId = doctor.doctor_id || (doctor as any).user?.user_id;
    try {
      setActionLoading(true);
      const updated = await verifyDoctor(entityId, status, reason);
      const flatUpdated = {
        ...doctor,
        ...updated,
        verification_status: status,
      };
      setDoctors((prev) =>
        prev.map((l) =>
          l.doctor_id === entityId || (l as any).user?.user_id === entityId
            ? (flatUpdated as any)
            : l,
        ),
      );
      if (
        selectedDoctor?.doctor_id === entityId ||
        (selectedDoctor as any)?.user?.user_id === entityId
      )
        setSelectedDoctor(flatUpdated as any);
      toast.success(`Doctor ${status.toLowerCase()} successfully`);
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setActionLoading(false);
      setActionModalOpen(false);
    }
  };

  const filtered = doctors.filter(
    (d) =>
      filterStatus === "ALL" ||
      d.verification_status?.toUpperCase() === filterStatus,
  );
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const current = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <Layout>
      <PageHeader
        title="Doctors Management"
        description="View and manage all registered doctors."
      />

      <FilterTabs
        tabs={[
          { id: "ALL", label: "All Doctors" },
          { id: "PENDING", label: "Pending Approval" },
          { id: "VERIFIED", label: "Verified" },
          { id: "REJECTED", label: "Rejected" },
        ]}
        activeTab={filterStatus}
        onTabChange={(id) => {
          setFilterStatus(id as any);
          setCurrentPage(1);
        }}
      />

      {loading && <LoadingState message="Loading doctors…" />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    "No.",
                    "Name",
                    "Email",
                    "Phone",
                    "Verification",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-slate-700 font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.map((doc, idx) => (
                  <tr
                    key={doc.doctor_id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-500">
                      {indexOfFirst + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {doc.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{doc.email}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {doc.phone_number}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={doc.verification_status}
                        label={doc.verification_status}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge type="active" status={doc.is_active} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedDoctor(doc);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canVerify && doc.verification_status?.toUpperCase() === "PENDING" && (
                          <>
                            <button
                              onClick={() =>
                                handleVerifyRequest(doc, "VERIFIED")
                              }
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleVerifyRequest(doc, "REJECTED")
                              }
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {canToggle && (
                          <button
                            onClick={() => handleToggleRequest(doc)}
                            disabled={actionLoading}
                            className={`p-1.5 rounded-lg ${doc.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                            title={doc.is_active ? "Deactivate" : "Activate"}
                          >
                            {doc.is_active ? (
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
                {current.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-400"
                    >
                      No doctors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            indexOfFirstItem={indexOfFirst}
            indexOfLastItem={indexOfLast}
          />
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen && !!selectedDoctor}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDoctor(null);
        }}
        title="Doctor Details"
      >
        {selectedDoctor && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                {selectedDoctor.full_name[0]}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedDoctor.full_name}
                </h4>
                <p className="text-sm text-slate-500">
                  {selectedDoctor.registration_number}
                </p>
              </div>
              {canToggle && (
                <button
                  onClick={() => handleToggleRequest(selectedDoctor)}
                  disabled={actionLoading}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedDoctor.is_active ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                >
                  {selectedDoctor.is_active ? "Deactivate" : "Activate"}
                </button>
              )}
            </div>

            {/* Info */}
            <div>
              <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-600" /> Doctor
                Information
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                  icon={UserIcon}
                  label="Full Name"
                  value={selectedDoctor.full_name}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={selectedDoctor.email}
                />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={selectedDoctor.phone_number}
                />
                <InfoRow
                  icon={UserIcon}
                  label="Gender"
                  value={selectedDoctor.gender}
                />
                <InfoRow
                  icon={FileText}
                  label="Reg. Number"
                  value={selectedDoctor.registration_number}
                />
                <InfoRow
                  icon={Award}
                  label="Experience"
                  value={`${selectedDoctor.experience_years} years`}
                />
                <InfoRow
                  icon={Activity}
                  label="Fee"
                  value={
                    selectedDoctor.consultation_fee
                      ? `₹${selectedDoctor.consultation_fee}`
                      : null
                  }
                />
                <InfoRow
                  icon={Shield}
                  label="Verification"
                  value={selectedDoctor.verification_status}
                />
                {selectedDoctor.verified_at && (
                  <InfoRow
                    icon={Calendar}
                    label="Verified At"
                    value={new Date(
                      selectedDoctor.verified_at,
                    ).toLocaleString()}
                  />
                )}
              </div>
            </div>

            {selectedDoctor.verification_notes && (
              <InfoRow
                icon={FileText}
                label="Verification Notes"
                value={selectedDoctor.verification_notes}
              />
            )}
          </div>
        )}
      </Modal>

      <ActionConfirmationModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onConfirm={handleModalConfirm}
        title={
          actionData.type === "TOGGLE"
            ? actionData.target?.is_active
              ? "Deactivate Doctor"
              : "Activate Doctor"
            : actionData.type === "VERIFIED"
              ? "Verify Doctor"
              : "Reject Doctor"
        }
        message={
          actionData.type === "TOGGLE"
            ? actionData.target?.is_active
              ? `Are you sure you want to deactivate ${actionData.target.full_name || actionData.target.email} ?`
              : `Are you sure you want to activate ${actionData.target?.full_name || actionData.target?.email} ?`
            : actionData.type === "VERIFIED"
              ? `Are you sure you want to verify ${actionData.target?.full_name || actionData.target?.email} ?`
              : `Are you sure you want to reject ${actionData.target?.full_name || actionData.target?.email} ?`
        }
        requireReason={true}
        reasonLabel={
          actionData.type === "TOGGLE"
            ? "Reason for status change"
            : "Verification Notes"
        }
        confirmLabel={
          actionData.type === "TOGGLE"
            ? actionData.target?.is_active
              ? "Deactivate"
              : "Activate"
            : actionData.type === "VERIFIED"
              ? "Verify"
              : "Reject"
        }
        loading={actionLoading}
      />
    </Layout>
  );
};

export default AdminDoctorsPage;
