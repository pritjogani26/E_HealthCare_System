import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { Layout } from "../components/common/Layout";
import { PageHeader } from "../components/common/PageHeader";
import { FilterTabs } from "../components/common/FilterTabs";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { StatusBadge } from "../components/common/StatusBadge";
import { apiService, handleApiError } from "../services/api";
import { LabProfile } from "../types";

const AdminLabsPage: React.FC = () => {
  const [labs, setLabs] = useState<LabProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');

  const loadLabs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllLabs();
      setLabs(data);
    } catch (e) {
      console.error("Failed to load labs", e);
      setError("Unable to load labs list.");
      toast.error("Failed to load labs");
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    if (statusParam === 'PENDING') {
      setFilterStatus('PENDING');
    }
    loadLabs();
  }, [location.search]);

  const handleVerifyLab = async (lab: LabProfile, status: 'VERIFIED' | 'REJECTED') => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this lab?`)) return;

    try {
      setActionLoading(true);
      const updatedLab = await apiService.verifyLab(lab.user.user_id, status);

      setLabs(prev =>
        prev.map(l => l.user.user_id === lab.user.user_id ? updatedLab : l)
      );

      toast.success(`Lab ${status.toLowerCase()} successfully`);
    } catch (e) {
      const message = handleApiError(e);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLabs = labs.filter(lab => {
    if (filterStatus === 'ALL') return true;
    return lab.verification_status === filterStatus;
  });

  return (
    <Layout>
      <PageHeader
        title="Labs Management"
        description="View and manage all registered laboratories in the system."
      />

      <FilterTabs
        tabs={[
          { id: 'ALL', label: 'All Labs' },
          { id: 'PENDING', label: 'Pending Approval' },
          { id: 'VERIFIED', label: 'Verified' },
          { id: 'REJECTED', label: 'Rejected' },
        ]}
        activeTab={filterStatus}
        onTabChange={(id) => setFilterStatus(id as any)}
      />

      {loading && <LoadingState message="Loading labs..." />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">City</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Phone</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Verification</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLabs.map((l) => (
                  <tr
                    key={l.user.user_id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">{l.lab_name}</td>
                    <td className="py-3 px-4 text-slate-600">{l.user.email}</td>
                    <td className="py-3 px-4 text-slate-600">{l.city}</td>
                    <td className="py-3 px-4 text-slate-600">{l.phone_number}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={l.verification_status} label={l.verification_status_display} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {l.verification_status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerifyLab(l, 'VERIFIED')}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerifyLab(l, 'REJECTED')}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
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
                {filteredLabs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 px-4 text-center text-slate-500"
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
    </Layout>
  );
};

export default AdminLabsPage;