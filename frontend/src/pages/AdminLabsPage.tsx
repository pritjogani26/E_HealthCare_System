import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Check,
  X,
  AlertCircle,
  Shield,
  Search
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService, handleApiError } from "../services/api";
import { LabProfile } from "../types";

const AdminLabsPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Toaster position="top-right" />
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="lg:pl-72">
        <Header setIsSidebarOpen={setIsSidebarOpen} />
        <main className="p-6 min-h-[calc(100vh-73px)] flex flex-col">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-1">Labs Management</h2>
            <p className="text-slate-600 text-sm">
              View and manage all registered laboratories in the system.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'ALL', label: 'All Labs' },
              { id: 'PENDING', label: 'Pending Approval' },
              { id: 'VERIFIED', label: 'Verified' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
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
              <div className="text-sm text-slate-600">Loading labs...</div>
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
                    {filteredLabs.map((l, index) => (
                      <tr
                        key={l.user.user_id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900">{l.lab_name}</td>
                        <td className="py-3 px-4 text-slate-600">{l.user.email}</td>
                        <td className="py-3 px-4 text-slate-600">{l.city}</td>
                        <td className="py-3 px-4 text-slate-600">{l.phone_number}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${l.verification_status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' :
                              l.verification_status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                l.verification_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-slate-100 text-slate-800'
                              }`}
                          >
                            {l.verification_status === 'PENDING' && <AlertCircle className="w-3 h-3" />}
                            {l.verification_status_display}
                          </span>
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
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminLabsPage;