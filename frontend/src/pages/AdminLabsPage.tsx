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
  UserCheck,
  UserX,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/common/Layout";
import { PageHeader } from "../components/common/PageHeader";
import { FilterTabs } from "../components/common/FilterTabs";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import { ActionConfirmationModal } from "../components/common/ActionConfirmationModal";
import { InfoRow } from "../components/common/InfoRow";
import { handleApiError } from "../services/api";
import { getAllLabs, toggleLabStatus, verifyLab } from "../services/admin_api";
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
  const { hasPermission } = useAuth();
  const canToggle = hasPermission("lab : toggle_status");
  const canVerify = hasPermission("lab : verify");

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionData, setActionData] = useState<{
    type: "TOGGLE" | "VERIFIED" | "REJECTED";
    target: LabList | null;
  }>({ type: "TOGGLE", target: null });

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
      setLabs(await getAllLabs());
    } catch (e) {
      setError("Unable to load labs list.");
      toast.error("Failed to load labs");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRequest = (
    lab: LabList,
    status: "VERIFIED" | "REJECTED",
  ) => {
    setActionData({ type: status, target: lab });
    setActionModalOpen(true);
  };

  const handleVerifyConfirm = async (reason: string) => {
    const lab = actionData.target;
    if (!lab) return;
    const status = actionData.type as "VERIFIED" | "REJECTED";
    const entityId = lab.lab_id || (lab as any).user?.user_id;
    try {
      setActionLoading(true);
      const updated = await verifyLab(entityId, status, reason);
      const flatUpdated = { ...lab, ...updated, verification_status: status };
      setLabs((prev) =>
        prev.map((l) =>
          l.lab_id === entityId || (l as any).user?.user_id === entityId
            ? (flatUpdated as any)
            : l,
        ),
      );
      if (
        selectedLab?.lab_id === entityId ||
        (selectedLab as any)?.user?.user_id === entityId
      )
        setSelectedLab(flatUpdated as any);
      toast.success(`Lab ${status.toLowerCase()} successfully`);
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setActionLoading(false);
      setActionModalOpen(false);
    }
  };

  const handleToggleRequest = (lab: LabList) => {
    setActionData({ type: "TOGGLE", target: lab });
    setActionModalOpen(true);
  };

  const handleToggleConfirm = async (reason: string) => {
    const lab = actionData.target;
    if (!lab) return;
    try {
      setActionLoading(true);
      const entityId = lab.lab_id || (lab as any).user?.user_id;
      const updated = await toggleLabStatus(entityId, reason);

      setLabs((prev) =>
        prev.map((l) => {
          const lId = l.lab_id || (l as any).user?.user_id;
          if (lId === entityId) {
            return { ...l, is_active: updated.is_active } as any;
          }
          return l;
        }),
      );

      if (
        selectedLab &&
        (selectedLab.lab_id === entityId ||
          (selectedLab as any).user?.user_id === entityId)
      ) {
        setSelectedLab({ ...selectedLab, is_active: updated.is_active } as any);
      }

      toast.success(updated.is_active ? "Lab activated" : "Lab deactivated");
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

  const filtered = labs.filter(
    (l) =>
      filterStatus === "ALL" ||
      l.verification_status?.toUpperCase() === filterStatus,
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
        <div
          className="overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d0dff0",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(26,60,110,0.07)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: "#e8f0f7",
                    borderBottom: "1px solid #d0dff0",
                  }}
                >
                  {[
                    "Name",
                    "Email",
                    "City",
                    "Phone",
                    "Verification",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 font-semibold"
                      style={{ color: "#1a3c6e" }}
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
                    style={{ borderBottom: "1px solid #e8f0f7" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f5f8fc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td
                      className="py-3 px-4 font-medium"
                      style={{ color: "#1a3c6e" }}
                    >
                      {lab.lab_name}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#555555" }}>
                      {lab.email || (lab as any).user?.email}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#555555" }}>
                      {lab.city || (lab as any).address?.city || "—"}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#555555" }}>
                      {lab.phone_number || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={lab.verification_status}
                        label={
                          lab.verification_status_display ||
                          lab.verification_status
                        }
                      />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge type="active" status={lab.is_active} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {/* View */}
                        <button
                          onClick={() => {
                            setSelectedLab(lab);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{
                            backgroundColor: "#e8f0f7",
                            color: "#1a3c6e",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#d0dff0")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#e8f0f7")
                          }
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Toggle */}
                        {canToggle && (
                          <button
                            onClick={() => handleToggleRequest(lab)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                            style={
                              lab.is_active
                                ? {
                                    backgroundColor: "#fef2f2",
                                    color: "#dc2626",
                                  }
                                : {
                                    backgroundColor: "#f0fdf4",
                                    color: "#16a34a",
                                  }
                            }
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.backgroundColor = lab.is_active
                                ? "#fee2e2"
                                : "#dcfce7";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.backgroundColor = lab.is_active
                                ? "#fef2f2"
                                : "#f0fdf4";
                            }}
                            title={lab.is_active ? "Deactivate" : "Activate"}
                          >
                            {lab.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Approve / Reject */}
                        {canVerify &&
                          lab.verification_status?.toUpperCase() ===
                            "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleVerifyRequest(lab, "VERIFIED")
                                }
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                style={{
                                  backgroundColor: "#f0fdf4",
                                  color: "#16a34a",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#dcfce7")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#f0fdf4")
                                }
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleVerifyRequest(lab, "REJECTED")
                                }
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                style={{
                                  backgroundColor: "#fef2f2",
                                  color: "#dc2626",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#fee2e2")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#fef2f2")
                                }
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
                      colSpan={7}
                      className="py-10 text-center"
                      style={{ color: "#555555" }}
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
            <div
              className="flex items-center gap-4 pb-4"
              style={{ borderBottom: "1px solid #d0dff0" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ backgroundColor: "#1a3c6e" }}
              >
                {selectedLab.lab_name[0]}
              </div>
              <div className="flex-1">
                <h4
                  className="text-base font-bold"
                  style={{ color: "#1a3c6e" }}
                >
                  {selectedLab.lab_name}
                </h4>
                <p className="text-sm" style={{ color: "#555555" }}>
                  {selectedLab.license_number ?? "No license on file"}
                </p>
              </div>
              {canToggle && (
                <button
                  onClick={() => handleToggleRequest(selectedLab)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={
                    selectedLab.is_active
                      ? { backgroundColor: "#fef2f2", color: "#dc2626" }
                      : { backgroundColor: "#f0fdf4", color: "#16a34a" }
                  }
                >
                  {selectedLab.is_active ? "Deactivate" : "Activate"}
                </button>
              )}
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
                value={
                  selectedLab.verification_status_display ||
                  selectedLab.verification_status
                }
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
              <h5
                className="text-sm font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: "#1a3c6e" }}
              >
                <MapPin className="w-4 h-4" style={{ color: "#36454F" }} />
                Address
              </h5>
              <div
                className="rounded-lg p-3 text-sm"
                style={{ backgroundColor: "#e8f0f7", color: "#555555" }}
              >
                {(selectedLab as any).address ||
                selectedLab.address_line ||
                selectedLab.city ? (
                  <>
                    {(selectedLab.address_line ||
                      (selectedLab as any).address?.address_line) && (
                      <p>
                        {selectedLab.address_line ||
                          (selectedLab as any).address?.address_line}
                      </p>
                    )}
                    <p>
                      {[
                        selectedLab.city || (selectedLab as any).address?.city,
                        selectedLab.state ||
                          (selectedLab as any).address?.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      {selectedLab.pincode ||
                      (selectedLab as any).address?.pincode
                        ? ` – ${selectedLab.pincode || (selectedLab as any).address?.pincode}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p style={{ color: "#888888", fontStyle: "italic" }}>
                    No address on file
                  </p>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            {(selectedLab.operating_hours?.length ?? 0) > 0 && (
              <div>
                <h5
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#1a3c6e" }}
                >
                  Operating Hours
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedLab.operating_hours?.map((oh, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg text-xs flex justify-between"
                      style={
                        oh.is_closed
                          ? {
                              backgroundColor: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                            }
                          : {
                              backgroundColor: "#e8f0f7",
                              border: "1px solid #d0dff0",
                              color: "#1a3c6e",
                            }
                      }
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

      <ActionConfirmationModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onConfirm={handleModalConfirm}
        title={
          actionData.type === "TOGGLE"
            ? actionData.target?.is_active
              ? "Deactivate Lab"
              : "Activate Lab"
            : actionData.type === "VERIFIED"
              ? "Verify Lab"
              : "Reject Lab"
        }
        message={
          actionData.type === "TOGGLE"
            ? actionData.target?.is_active
              ? `Are you sure you want to deactivate lab ${actionData.target.lab_name} ?`
              : `Are you sure you want to activate lab ${actionData.target?.lab_name} ?`
            : actionData.type === "VERIFIED"
              ? `Are you sure you want to verify lab ${actionData.target?.lab_name} ?`
              : `Are you sure you want to reject lab ${actionData.target?.lab_name} ?`
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

export default AdminLabsPage;
