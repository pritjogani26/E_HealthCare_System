// frontend/src/pages/AdminLabsPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Check,
  X,
  Eye,
  MapPin,
  Phone,
  Building2,
  FileText,
  Shield,
  Calendar,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import { Layout } from "../components/common/Layout";
import { PageHeader } from "../components/common/PageHeader";
import { FilterTabs } from "../components/common/FilterTabs";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import { InfoRow } from "../components/common/InfoRow";
import { apiService, handleApiError } from "../services/api";
import { LabProfile, LabList } from "../types";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const AdminLabsPage: React.FC = () => {
  const [labs, setLabs] = useState<LabList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "VERIFIED" | "REJECTED"
  >("ALL");
  const [selectedLab, setSelectedLab] = useState<LabList | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const toast = useToast();

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("status") === "PENDING") setFilterStatus("PENDING");
    loadLabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadLabs = async () => {
    try {
      setLoading(true);
      setError(null);
      setLabs(await apiService.getAllLabs());
    } catch (e) {
      setError("Unable to load labs list.");
      toast.error("Failed to load labs");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLab = async (
    lab: LabList,
    status: "VERIFIED" | "REJECTED",
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to ${status.toLowerCase()} this lab?`,
      )
    )
      return;
    const labId = lab.lab_id || (lab as any).user?.user_id;
    try {
      setActionLoading(true);
      const updated = await apiService.verifyLab(labId, status);
      // Backend returns LabProfile for verifyLab, but we will merge it into LabList
      const flatUpdated = { ...lab, ...updated, verification_status: status };
      setLabs((prev) =>
        prev.map((l) => (l.lab_id === labId || (l as any).user?.user_id === labId ? (flatUpdated as any) : l)),
      );
      if (selectedLab?.lab_id === labId || (selectedLab as any)?.user?.user_id === labId)
        setSelectedLab(flatUpdated as any);
      toast.success(`Lab ${status.toLowerCase()} successfully`);
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = labs.filter(
    (l) => filterStatus === "ALL" || l.verification_status?.toUpperCase() === filterStatus,
  );


  return (
    <Layout>
      <PageHeader
        title="Labs Management"
        description="View and manage all registered laboratories."
      />

      <FilterTabs
        tabs={[
          { id: "ALL", label: "All Labs" },
          { id: "PENDING", label: "Pending Approval" },
          { id: "VERIFIED", label: "Verified" },
          { id: "REJECTED", label: "Rejected" },
        ]}
        activeTab={filterStatus}
        onTabChange={(id) => setFilterStatus(id as any)}
      />

      {loading && <LoadingState message="Loading labs…" />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    "Name",
                    "Email",
                    "City",
                    "Phone",
                    "Verification",
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
                {filtered.map((lab) => (
                  <tr
                    key={lab.lab_id || (lab as any).user?.user_id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {lab.lab_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {lab.email || (lab as any).user?.email}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {lab.city || (lab as any).address?.city || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {lab.phone_number || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={lab.verification_status}
                        label={lab.verification_status_display || lab.verification_status}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedLab(lab);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {lab.verification_status?.toUpperCase() === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleVerifyLab(lab, "VERIFIED")}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerifyLab(lab, "REJECTED")}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-slate-400"
                    >
                      No labs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen && !!selectedLab}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLab(null);
        }}
        title="Lab Details"
        size="lg"
      >
        {selectedLab && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                {selectedLab.lab_name[0]}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedLab.lab_name}
                </h4>
                <p className="text-sm text-slate-500">
                  {selectedLab.license_number ?? "No license on file"}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow
                icon={Building2}
                label="Lab Name"
                value={selectedLab.lab_name}
              />
              <InfoRow
                icon={FileText}
                label="License Number"
                value={selectedLab.license_number}
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={selectedLab.phone_number}
              />
              <InfoRow
                icon={Shield}
                label="Verification"
                value={selectedLab.verification_status_display || selectedLab.verification_status}
              />
              {selectedLab.verified_at && (
                <InfoRow
                  icon={Calendar}
                  label="Verified At"
                  value={new Date(selectedLab.verified_at).toLocaleString()}
                />
              )}
            </div>

            {/* Address */}
            <div>
              <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" /> Address
              </h5>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                {(selectedLab as any).address || selectedLab.address_line || selectedLab.city ? (
                  <>
                    {(selectedLab.address_line || (selectedLab as any).address?.address_line) && (
                      <p>{selectedLab.address_line || (selectedLab as any).address?.address_line}</p>
                    )}
                    <p>
                      {[selectedLab.city || (selectedLab as any).address?.city, selectedLab.state || (selectedLab as any).address?.state]
                        .filter(Boolean)
                        .join(", ")}
                      {selectedLab.pincode || (selectedLab as any).address?.pincode
                        ? ` – ${selectedLab.pincode || (selectedLab as any).address?.pincode}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 italic">No address on file</p>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            {(selectedLab.operating_hours?.length ?? 0) > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-2">
                  Operating Hours
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedLab.operating_hours?.map((oh, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-xs flex justify-between border ${oh.is_closed ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}
                    >
                      <span className="font-medium">
                        {DAY_NAMES[oh.day_of_week]}
                      </span>
                      <span>
                        {oh.is_closed
                          ? "Closed"
                          : `${oh.open_time} – ${oh.close_time}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedLab.verification_notes && (
              <InfoRow
                icon={FileText}
                label="Verification Notes"
                value={selectedLab.verification_notes}
              />
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AdminLabsPage;
