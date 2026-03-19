// frontend/src/pages/SettingsPage.tsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Activity,
  Droplet,
  User,
  Award,
  ShieldCheck,
  Users,
  ToggleLeft,
  ToggleRight,
  X,
  Info,
} from "lucide-react";
import * as settingsApi from "../services/settings_api";
import { toast } from "react-hot-toast";
import { Layout } from "../components/common/Layout";
import { PageHeader } from "../components/common/PageHeader";

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("bloodGroups");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<settingsApi.LookupItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    value: "",
    name: "",
    code: "",
    description: "",
  });

  const tabs = [
    { id: "bloodGroups", label: "Blood Groups", icon: Droplet },
    { id: "genders", label: "Genders", icon: User },
    { id: "specializations", label: "Specializations", icon: Activity },
    { id: "qualifications", label: "Qualifications", icon: Award },
    { id: "verificationTypes", label: "Verification Types", icon: ShieldCheck },
    { id: "userRoles", label: "User Roles", icon: Users },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      let result;
      switch (activeTab) {
        case "bloodGroups":
          result = await settingsApi.getBloodGroups();
          break;
        case "genders":
          result = await settingsApi.getGenders();
          break;
        case "specializations":
          result = await settingsApi.getSpecializations();
          break;
        case "qualifications":
          result = await settingsApi.getQualifications();
          break;
        case "verificationTypes":
          result = await settingsApi.getVerificationTypes();
          break;
        case "userRoles":
          result = await settingsApi.getUserRoles();
          break;
      }
      if (result?.success) {
        setData(result.data);
      }
    } catch (error) {
      toast.error("Failed to fetch settings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleToggleStatus = async (item: settingsApi.LookupItem) => {
    try {
      let result;
      if (activeTab === "specializations") {
        result = await settingsApi.toggleSpecializationStatus(
          item.specialization_id!,
          !item.is_active,
        );
      } else if (activeTab === "qualifications") {
        result = await settingsApi.toggleQualificationStatus(
          item.qualification_id!,
          !item.is_active,
        );
      }

      if (result?.success) {
        toast.success("Status updated successfully");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleAddEntries = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let result;
      switch (activeTab) {
        case "bloodGroups":
          result = await settingsApi.addBloodGroup(formData.value);
          break;
        case "genders":
          result = await settingsApi.addGender(formData.value);
          break;
        case "specializations":
          result = await settingsApi.addSpecialization(
            formData.name,
            formData.description,
          );
          break;
        case "qualifications":
          result = await settingsApi.addQualification(
            formData.code,
            formData.name,
          );
          break;
        case "verificationTypes":
          result = await settingsApi.addVerificationType(
            formData.name,
            formData.description,
          );
          break;
        case "userRoles":
          result = await settingsApi.addUserRole(
            formData.name,
            formData.description,
          );
          break;
      }

      if (result?.success) {
        toast.success("Entry added successfully");
        setShowAddModal(false);
        setFormData({ value: "", name: "", code: "", description: "" });
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to add entry");
    }
  };

  const renderTableHeaders = () => {
    switch (activeTab) {
      case "bloodGroups":
        return ["ID", "Blood Group"];
      case "genders":
        return ["ID", "Gender"];
      case "specializations":
        return ["ID", "Name", "Description", "Status"];
      case "qualifications":
        return ["ID", "Code", "Name", "Status"];
      case "verificationTypes":
        return ["ID", "Name", "Description"];
      case "userRoles":
        return ["ID", "Role", "Description"];
      default:
        return [];
    }
  };

  const renderRow = (item: settingsApi.LookupItem) => {
    switch (activeTab) {
      case "bloodGroups":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              #{item.blood_group_id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 font-mono">
              {item.blood_group_value}
            </td>
          </>
        );
      case "genders":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              #{item.gender_id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
              {item.gender_value}
            </td>
          </>
        );
      case "specializations":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              #{item.specialization_id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
              {item.specialization_name}
            </td>
            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
              {item.description || "-"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <button
                onClick={() => handleToggleStatus(item)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                  item.is_active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}
              >
                {item.is_active ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                {item.is_active ? "Active" : "Inactive"}
              </button>
            </td>
          </>
        );
      case "qualifications":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              #{item.qualification_id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
              {item.qualification_code}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
              {item.qualification_name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <button
                onClick={() => handleToggleStatus(item)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                  item.is_active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}
              >
                {item.is_active ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                {item.is_active ? "Active" : "Inactive"}
              </button>
            </td>
          </>
        );
      case "verificationTypes":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              #{item.id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
              {item.name}
            </td>
            <td className="px-6 py-4 text-sm text-slate-600">
              {item.description || "-"}
            </td>
          </>
        );
      case "userRoles":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              #{item.role_id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-amber-600">
              {item.role}
            </td>
            <td className="px-6 py-4 text-sm text-slate-600">
              {item.role_description || "-"}
            </td>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <PageHeader
        title="System Settings"
        description="Manage system-wide configuration and lookup data."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">
                Configuration
              </h3>
            </div>

    <nav className="p-2 h-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 my-1 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                isActive ? "text-emerald-500" : "text-slate-400"
              }`}
            />
            <span className="flex-1 text-left">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  </div>
</aside>

        {/* Content */}
        <main className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-800">
                {tabs.find((t) => t.id === activeTab)?.label}
              </span>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {renderTableHeaders().map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-slate-700 font-semibold"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array(6)
                      .fill(0)
                      .map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {renderTableHeaders().map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <div className="h-4 bg-slate-100 rounded w-full"></div>
                            </td>
                          ))}
                        </tr>
                      ))
                  ) : data.length > 0 ? (
                    data.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        {renderRow(item)}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-100 rounded-full">
                            <Info className="w-8 h-8 text-slate-400" />
                          </div>
                          <span className="font-medium">
                            No entries found for{" "}
                            {tabs.find((t) => t.id === activeTab)?.label}
                          </span>
                          <p className="text-sm text-slate-400">
                            Click "Add New" to create the first entry.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-50">
                  <Plus className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add New{" "}
                  {tabs.find((t) => t.id === activeTab)?.label.slice(0, -1)}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleAddEntries} className="space-y-4">
                {(activeTab === "bloodGroups" || activeTab === "genders") && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                      placeholder={
                        activeTab === "bloodGroups" ? "e.g. A+" : "e.g. Male"
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 transition-all"
                    />
                  </div>
                )}

                {(activeTab === "specializations" ||
                  activeTab === "verificationTypes" ||
                  activeTab === "userRoles") && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Name / Role
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 transition-all h-24 resize-none"
                      />
                    </div>
                  </>
                )}

                {activeTab === "qualifications" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Qualification Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MBBS"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Qualification Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 transition-all"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-50 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SettingsPage;