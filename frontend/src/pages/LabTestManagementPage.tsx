import React, { useEffect, useState } from "react";
import {
  fetchLabCategories,
  createLabCategory,
  updateLabCategory,
  deleteLabCategory,
  fetchLabCategoryDetails,
  LabTestCategory,
  fetchLabTests,
  createLabTest,
  updateLabTest,
  deleteLabTest,
  LabTest,
  TestParameter,
  fetchTestParameters,
  createTestParameter,
  updateTestParameter,
  deleteTestParameter,
  fetchLabTestDetails,
  generateLabSlots,
} from "../services/labService";
import { useToast } from "../hooks/useToast";
import { Calendar, Clock, Loader2, CheckCircle } from "lucide-react";

// --- Slot Management Component ---
const SlotManagement: React.FC = () => {
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateLabSlots(days);
      toast.success(`Successfully generated ${result.slots_created} slots!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate slots");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Generate Time Slots
            </h3>
            <p className="text-sm text-slate-500">
              Enable patients to book appointments
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Number of days to generate for
            </label>
            <div className="flex gap-3">
              {[7, 15, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    days === d
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-200"
                      : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 items-start">
            <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Slots will be generated based on your{" "}
              <strong>Operating Hours</strong>. Existing slots for these dates
              will not be duplicated.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <CheckCircle size={20} />
            )}
            {loading ? "Generating..." : "Generate Slots Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

const LabTestManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"tests" | "categories" | "slots">(
    "tests",
  );

  const [categories, setCategories] = useState<LabTestCategory[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [parameters, setParameters] = useState<TestParameter[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "categories") {
        const data = await fetchLabCategories();
        setCategories(data || []);
      } else if (activeTab === "tests") {
        const [testsData, catsData] = await Promise.all([
          fetchLabTests(),
          fetchLabCategories(),
        ]);
        setTests(testsData || []);
        setCategories(catsData || []);
      } else {
        const [paramsData, testsData] = await Promise.all([
          fetchTestParameters(),
          fetchLabTests(),
        ]);
        setParameters(paramsData || []);
        setTests(testsData || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-semibold mb-1"
          style={{ color: "#1a3c6e" }}
        >
          Lab Test Management
        </h2>
        <p className="text-sm" style={{ color: "#555555" }}>
          Manage lab test categories, tests, and parameters.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors"
          style={
            activeTab === "tests"
              ? { backgroundColor: "#1a3c6e", color: "#ffffff" }
              : { backgroundColor: "#e8f0f7", color: "#1a3c6e" }
          }
          onClick={() => setActiveTab("tests")}
          onMouseEnter={(e) => {
            if (activeTab !== "tests")
              e.currentTarget.style.backgroundColor = "#d0dff0";
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "tests")
              e.currentTarget.style.backgroundColor = "#e8f0f7";
          }}
        >
          Tests
        </button>

        <button
          className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors"
          style={
            activeTab === "categories"
              ? { backgroundColor: "#1a3c6e", color: "#ffffff" }
              : { backgroundColor: "#e8f0f7", color: "#1a3c6e" }
          }
          onClick={() => setActiveTab("categories")}
          onMouseEnter={(e) => {
            if (activeTab !== "categories")
              e.currentTarget.style.backgroundColor = "#d0dff0";
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "categories")
              e.currentTarget.style.backgroundColor = "#e8f0f7";
          }}
        >
          Categories
        </button>

        <button
          className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors"
          style={
            activeTab === "slots"
              ? { backgroundColor: "#1a3c6e", color: "#ffffff" }
              : { backgroundColor: "#e8f0f7", color: "#1a3c6e" }
          }
          onClick={() => setActiveTab("slots")}
          onMouseEnter={(e) => {
            if (activeTab !== "slots")
              e.currentTarget.style.backgroundColor = "#d0dff0";
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "slots")
              e.currentTarget.style.backgroundColor = "#e8f0f7";
          }}
        >
          Manage Slots
        </button>
      </div>

      {error && (
        <div
          className="text-red-600 mb-4 p-3 rounded-lg border"
          style={{ backgroundColor: "#fff1f2", borderColor: "#fecdd3" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10">
          <div
            className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent"
            style={{ borderColor: "#d0dff0", borderTopColor: "#1a3c6e" }}
          ></div>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d0dff0",
            boxShadow: "0 2px 8px rgba(26,60,110,0.07)",
          }}
        >
          {activeTab === "categories" ? (
            <CategoryList categories={categories} reload={loadData} />
          ) : activeTab === "tests" ? (
            <TestList tests={tests} categories={categories} reload={loadData} />
          ) : (
            <SlotManagement />
          )}
        </div>
      )}
    </>
  );
};

function CategoryList({
  categories,
  reload,
}: {
  categories: LabTestCategory[];
  reload: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
    is_active: true,
  });

  const handleEditClick = async (category: LabTestCategory) => {
    try {
      if (category.category_id) {
        const details = await fetchLabCategoryDetails(category.category_id);
        setFormData({
          category_name: details.category_name,
          description: details.description || "",
          is_active: details.is_active !== undefined ? details.is_active : true,
        });
        setEditingCategoryId(category.category_id);
        setShowModal(true);
      }
    } catch (err: any) {
      alert(
        "Error fetching category details: " + (err.message || "Unknown error"),
      );
    }
  };

  const handleAddClick = () => {
    setFormData({ category_name: "", description: "", is_active: true });
    setEditingCategoryId(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await updateLabCategory(editingCategoryId, formData);
      } else {
        await createLabCategory(formData);
      }
      setShowModal(false);
      setEditingCategoryId(null);
      setFormData({ category_name: "", description: "", is_active: true });
      reload();
    } catch (err: any) {
      alert("Error saving category: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div>
      <div
        className="p-4 border-b flex justify-between items-center"
        style={{ backgroundColor: "#e8f0f7", borderColor: "#d0dff0" }}
      >
        <h2 className="text-base font-semibold" style={{ color: "#1a3c6e" }}>
          Lab Categories
        </h2>
        <button
          className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors text-white"
          style={{ backgroundColor: "#1a3c6e" }}
          onClick={handleAddClick}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#152d52")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#1a3c6e")
          }
        >
          + Add Category
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-96 border"
            style={{ borderColor: "#d0dff0" }}
          >
            <h3
              className="text-base font-semibold mb-4"
              style={{ color: "#1a3c6e" }}
            >
              {editingCategoryId ? "Edit Category" : "Add New Category"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#1a3c6e" }}
                >
                  Category Name *
                </label>
                <input
                  required
                  type="text"
                  className="block w-full rounded-lg border p-2 text-sm outline-none transition"
                  style={{ borderColor: "#d0dff0", color: "#1a3c6e" }}
                  value={formData.category_name}
                  onChange={(e) =>
                    setFormData({ ...formData, category_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#1a3c6e" }}
                >
                  Description
                </label>
                <textarea
                  className="block w-full rounded-lg border p-2 text-sm outline-none transition"
                  style={{ borderColor: "#d0dff0", color: "#555555" }}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="category_is_active"
                  className="h-4 w-4 rounded"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label
                  htmlFor="category_is_active"
                  className="ml-2 text-sm font-medium"
                  style={{ color: "#1a3c6e" }}
                >
                  Is Active
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm rounded-lg border transition"
                  style={{ borderColor: "#d0dff0", color: "#555555" }}
                  onClick={() => setShowModal(false)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f5f8fc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg text-white transition"
                  style={{ backgroundColor: "#1a3c6e" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#152d52")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#1a3c6e")
                  }
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="min-w-full">
        <thead
          style={{
            backgroundColor: "#e8f0f7",
            borderBottom: "1px solid #d0dff0",
          }}
        >
          <tr>
            <th
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#1a3c6e" }}
            >
              ID
            </th>
            <th
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#1a3c6e" }}
            >
              Name
            </th>
            <th
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#1a3c6e" }}
            >
              Description
            </th>
            <th
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#1a3c6e" }}
            >
              Status
            </th>
            <th
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#1a3c6e" }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "#e8f0f7" }}>
          {categories.map((c, i) => (
            <tr
              key={i}
              style={{ borderBottom: "1px solid #e8f0f7" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <td
                className="px-5 py-3.5 whitespace-nowrap text-sm"
                style={{ color: "#555555" }}
              >
                {c.category_id}
              </td>
              <td
                className="px-5 py-3.5 whitespace-nowrap text-sm font-medium"
                style={{ color: "#1a3c6e" }}
              >
                {c.category_name}
              </td>
              <td
                className="px-5 py-3.5 whitespace-nowrap text-sm truncate max-w-xs"
                style={{ color: "#555555" }}
              >
                {c.description}
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                >
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                <button
                  className="p-1.5 rounded-lg transition-colors mr-1"
                  style={{ backgroundColor: "#e8f0f7", color: "#1a3c6e" }}
                  onClick={() => handleEditClick(c)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#d0dff0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e8f0f7")
                  }
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}
                  onClick={async () => {
                    if (window.confirm("Are you sure?")) {
                      await deleteLabCategory(c.category_id!);
                      reload();
                    }
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#fee2e2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#fef2f2")
                  }
                  title="Delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-5 py-10 text-center text-sm"
                style={{ color: "#555555" }}
              >
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TestList({
  tests,
  categories,
  reload,
}: {
  tests: LabTest[];
  categories: LabTestCategory[];
  reload: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [viewTestDetails, setViewTestDetails] = useState<LabTest | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [formData, setFormData] = useState<LabTest>({
    test_code: "",
    test_name: "",
    category_id: undefined,
    description: "",
    sample_type: "",
    price: 0,
    fasting_required: false,
    fasting_hours: 0,
    turnaround_hours: 0,
    is_active: true,
    parameters: [],
  });

  const handleViewDetails = async (testId: number) => {
    setLoadingDetails(true);
    try {
      const details = await fetchLabTestDetails(testId);
      setViewTestDetails(details);
    } catch (err: any) {
      alert("Error loading details: " + (err.message || "Unknown error"));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddClick = () => {
    setEditingTestId(null);
    setFormData({
      test_code: "",
      test_name: "",
      category_id: undefined,
      description: "",
      sample_type: "",
      price: 0,
      fasting_required: false,
      fasting_hours: 0,
      turnaround_hours: 0,
      is_active: true,
      parameters: [],
    });
    setShowModal(true);
  };

  const handleEditClick = async (testId: number) => {
    setLoadingDetails(true);
    try {
      const details = await fetchLabTestDetails(testId);
      setFormData({
        ...details,
        is_active: details.is_active !== undefined ? details.is_active : true,
        parameters: details.parameters || [],
      });
      setEditingTestId(testId);
      setShowModal(true);
    } catch (err: any) {
      alert("Error loading test details: " + (err.message || "Unknown error"));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddParameter = () => {
    setFormData({
      ...formData,
      parameters: [
        ...(formData.parameters || []),
        { parameter_name: "", test_id: 0, unit: "", normal_range: "" },
      ],
    });
  };

  const handleParameterChange = (
    index: number,
    field: keyof TestParameter,
    value: any,
  ) => {
    const newParams = [...(formData.parameters || [])];
    newParams[index] = { ...newParams[index], [field]: value };
    setFormData({ ...formData, parameters: newParams });
  };

  const handleRemoveParameter = (index: number) => {
    const newParams = [...(formData.parameters || [])];
    newParams.splice(index, 1);
    setFormData({ ...formData, parameters: newParams });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        fasting_hours: Number(formData.fasting_hours),
        turnaround_hours: Number(formData.turnaround_hours),
      };
      if (editingTestId) {
        await updateLabTest(editingTestId, payload);
      } else {
        await createLabTest(payload);
      }
      setShowModal(false);
      reload();
    } catch (err: any) {
      alert(
        `Error ${editingTestId ? "updating" : "creating"} test: ` +
          (err.message || "Unknown error"),
      );
    }
  };

  return (
    <div>
      <div
        className="p-4 border-b flex justify-between items-center"
        style={{ backgroundColor: "#e8f0f7", borderColor: "#d0dff0" }}
      >
        <h2 className="text-base font-semibold" style={{ color: "#1a3c6e" }}>
          Lab Tests
        </h2>
        <button
          className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors text-white"
          style={{ backgroundColor: "#1a3c6e" }}
          onClick={handleAddClick}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#152d52")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#1a3c6e")
          }
        >
          + Add Test
        </button>
      </div>

      {viewTestDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 py-4 px-2 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-full overflow-y-auto transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-xl text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">
                  {viewTestDetails.test_name}
                </h3>
                <span className="bg-white/20 px-2 py-1 rounded text-xs mt-2 inline-block font-medium tracking-wider">
                  CODE: {viewTestDetails.test_code}
                </span>
              </div>
              <button
                className="text-white hover:text-gray-200 focus:outline-none"
                onClick={() => setViewTestDetails(null)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-gray-700 leading-relaxed text-sm md:text-base border-l-4 border-indigo-500 pl-4 bg-indigo-50 p-3 rounded-r-md">
                {viewTestDetails.description || "No description provided."}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-inner">
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1">
                    Category
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {categories.find(
                      (c) => c.category_id === viewTestDetails.category_id,
                    )?.category_name || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1">
                    Sample Type
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {viewTestDetails.sample_type}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1">
                    Price
                  </span>
                  <span className="block text-sm font-medium text-green-600">
                    {viewTestDetails.price}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1">
                    Lab Name
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {viewTestDetails.created_by_name || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1">
                    Status
                  </span>
                  <span
                    className={`inline-flex text-xs leading-5 font-semibold rounded-full ${viewTestDetails.is_active ? "bg-green-100 text-green-800 px-2" : "bg-red-100 text-red-800 px-2"}`}
                  >
                    {viewTestDetails.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1 mt-2">
                    Fasting
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {viewTestDetails.fasting_required
                      ? `Yes (${viewTestDetails.fasting_hours} hrs)`
                      : "No"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1 mt-2">
                    Turnaround Time
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {viewTestDetails.turnaround_hours
                      ? `${viewTestDetails.turnaround_hours} hours`
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1 mt-2">
                    Created At
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {viewTestDetails.created_at
                      ? new Date(viewTestDetails.created_at).toLocaleString()
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1 mt-2">
                    Updated At
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {viewTestDetails.updated_at
                      ? new Date(viewTestDetails.updated_at).toLocaleString()
                      : "-"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  Test Parameters
                </h4>
                {viewTestDetails.parameters &&
                viewTestDetails.parameters.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Parameter Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Normal Range
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewTestDetails.parameters.map((p, idx) => (
                          <tr
                            key={idx}
                            className={
                              idx % 2 === 0
                                ? "bg-white hover:bg-gray-50 transition-colors"
                                : "bg-gray-50 hover:bg-gray-100 transition-colors"
                            }
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {p.parameter_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {p.unit ? (
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs border border-indigo-100 font-medium">
                                  {p.unit}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600 font-medium">
                              {p.normal_range || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <p className="text-gray-500 font-medium">
                      No parameters defined for this test.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end border-t border-gray-200">
              <button
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors focus:ring-4 focus:ring-gray-200"
                onClick={() => setViewTestDetails(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
            <p className="mt-4 text-indigo-800 font-bold">
              Loading Test Details...
            </p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 py-4 px-2">
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl max-h-full overflow-y-auto border"
            style={{ borderColor: "#d0dff0" }}
          >
            <h3
              className="text-base font-semibold mb-4"
              style={{ color: "#1a3c6e" }}
            >
              {editingTestId ? "Edit Lab Test" : "Add New Lab Test"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1a3c6e" }}
                  >
                    Test Code *
                  </label>
                  <input
                    required
                    type="text"
                    className="block w-full rounded-lg border p-2 text-sm outline-none"
                    style={{ borderColor: "#d0dff0", color: "#1a3c6e" }}
                    value={formData.test_code}
                    onChange={(e) =>
                      setFormData({ ...formData, test_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1a3c6e" }}
                  >
                    Test Name *
                  </label>
                  <input
                    required
                    type="text"
                    className="block w-full rounded-lg border p-2 text-sm outline-none"
                    style={{ borderColor: "#d0dff0", color: "#1a3c6e" }}
                    value={formData.test_name}
                    onChange={(e) =>
                      setFormData({ ...formData, test_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1a3c6e" }}
                  >
                    Category
                  </label>
                  <select
                    className="block w-full rounded-lg border p-2 text-sm outline-none"
                    style={{ borderColor: "#d0dff0", color: "#1a3c6e" }}
                    value={formData.category_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category_id: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  >
                    <option value="">-- None --</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1a3c6e" }}
                  >
                    Price *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="block w-full rounded-lg border p-2 text-sm outline-none"
                    style={{ borderColor: "#d0dff0", color: "#1a3c6e" }}
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1a3c6e" }}
                  >
                    Sample Type *
                  </label>
                  <input
                    required
                    type="text"
                    className="block w-full rounded-lg border p-2 text-sm outline-none"
                    style={{ borderColor: "#d0dff0", color: "#1a3c6e" }}
                    value={formData.sample_type}
                    onChange={(e) =>
                      setFormData({ ...formData, sample_type: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1a3c6e" }}
                  >
                    Turnaround Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="block w-full rounded-lg border p-2 text-sm outline-none"
                    style={{ borderColor: "#d0dff0", color: "#1a3c6e" }}
                    value={formData.turnaround_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        turnaround_hours: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1a3c6e" }}
                  >
                    Description
                  </label>
                  <textarea
                    className="block w-full rounded-lg border p-2 text-sm outline-none"
                    style={{ borderColor: "#d0dff0", color: "#555555" }}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 flex items-center mt-6 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="fasting_required"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={formData.fasting_required}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fasting_required: e.target.checked,
                        })
                      }
                    />
                    <label
                      htmlFor="fasting_required"
                      className="ml-2 block text-sm font-medium text-gray-700"
                    >
                      Fasting Required
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="test_is_active"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                    />
                    <label
                      htmlFor="test_is_active"
                      className="ml-2 block text-sm font-medium text-gray-700"
                    >
                      Is Active
                    </label>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#1a3c6e" }}
                  >
                    Fasting Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!formData.fasting_required}
                    className="block w-full rounded-lg border p-2 text-sm outline-none disabled:opacity-50"
                    style={{ borderColor: "#d0dff0", color: "#1a3c6e" }}
                    value={formData.fasting_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fasting_hours: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-2 mt-4 border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Included Test Parameters (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddParameter}
                      className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-md font-medium transition-colors"
                    >
                      + Add Parameter
                    </button>
                  </div>
                  {formData.parameters &&
                    formData.parameters.map((param, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-end mb-2 p-3 bg-gray-50 border border-gray-200 rounded-md"
                      >
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Parameter Name *
                          </label>
                          <input
                            required
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm border p-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                            value={param.parameter_name}
                            onChange={(e) =>
                              handleParameterChange(
                                index,
                                "parameter_name",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Red blood cell count"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Unit
                          </label>
                          <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm border p-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                            value={param.unit || ""}
                            onChange={(e) =>
                              handleParameterChange(
                                index,
                                "unit",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. g/dL"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Normal Range
                          </label>
                          <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm border p-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                            value={param.normal_range || ""}
                            onChange={(e) =>
                              handleParameterChange(
                                index,
                                "normal_range",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 13.0 - 17.0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(index)}
                          className="mb-0.5 text-red-600 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                          title="Remove parameter"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  {(!formData.parameters ||
                    formData.parameters.length === 0) && (
                    <p className="text-xs text-gray-500 italic py-2">
                      No parameters added. You can add them here or later from
                      the Parameters tab.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm rounded-lg border transition"
                  style={{ borderColor: "#d0dff0", color: "#555555" }}
                  onClick={() => setShowModal(false)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f5f8fc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg text-white transition"
                  style={{ backgroundColor: "#1a3c6e" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#152d52")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#1a3c6e")
                  }
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead
            style={{
              backgroundColor: "#e8f0f7",
              borderBottom: "1px solid #d0dff0",
            }}
          >
            <tr>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#1a3c6e" }}
              >
                Test Code
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#1a3c6e" }}
              >
                Name
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#1a3c6e" }}
              >
                Category
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#1a3c6e" }}
              >
                Price
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#1a3c6e" }}
              >
                Status
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#1a3c6e" }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#e8f0f7" }}>
            {tests.map((t, i) => (
              <tr
                key={i}
                style={{ borderBottom: "1px solid #e8f0f7" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f5f8fc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <td
                  className="px-5 py-3.5 whitespace-nowrap text-sm font-medium"
                  style={{ color: "#1a3c6e" }}
                >
                  {t.test_code}
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap text-sm font-medium"
                  style={{ color: "#1a3c6e" }}
                >
                  {t.test_name}
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap text-sm"
                  style={{ color: "#555555" }}
                >
                  {categories.find((c) => c.category_id === t.category_id)
                    ?.category_name || "-"}
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold"
                  style={{ color: "#1a3c6e" }}
                >
                  ₹{t.price}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-1.5">
                    <button
                      className="p-1.5 rounded-lg transition-colors text-xs font-medium px-2"
                      style={{ backgroundColor: "#e8f0f7", color: "#1a3c6e" }}
                      onClick={() => handleViewDetails(t.test_id!)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#d0dff0")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#e8f0f7")
                      }
                      title="View Details"
                    >
                      Details
                    </button>
                    <button
                      className="p-1.5 rounded-lg transition-colors text-xs font-medium px-2"
                      style={{ backgroundColor: "#e8f0f7", color: "#1a3c6e" }}
                      onClick={() => handleEditClick(t.test_id!)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#d0dff0")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#e8f0f7")
                      }
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className="p-1.5 rounded-lg transition-colors text-xs font-medium px-2"
                      style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}
                      onClick={async () => {
                        if (window.confirm("Are you sure?")) {
                          await deleteLabTest(t.test_id!);
                          reload();
                        }
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fee2e2")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fef2f2")
                      }
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tests.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm"
                  style={{ color: "#555555" }}
                >
                  No tests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ParameterList({
  parameters,
  tests,
  reload,
}: {
  parameters: TestParameter[];
  tests: LabTest[];
  reload: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<TestParameter>({
    parameter_name: "",
    test_id: 0,
    unit: "",
    normal_range: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && formData.parameter_id) {
        await updateTestParameter(formData.parameter_id, {
          ...formData,
          test_id: Number(formData.test_id),
        });
      } else {
        await createTestParameter({
          ...formData,
          test_id: Number(formData.test_id),
        });
      }
      setShowModal(false);
      reload();
    } catch (err: any) {
      alert(
        `Error ${isEdit ? "updating" : "creating"} parameter: ${err.message || "Unknown error"}`,
      );
    }
  };

  const handleEdit = (p: TestParameter) => {
    setFormData({ ...p });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({ parameter_name: "", test_id: 0, unit: "", normal_range: "" });
    setIsEdit(false);
    setShowModal(true);
  };

  return (
    <div>
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700">Test Parameters</h2>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
          onClick={handleAddNew}
        >
          + Add Parameter
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[32rem]">
            <h3 className="text-lg font-bold mb-4">
              {isEdit ? "Edit Parameter" : "Add New Parameter"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lab Test *
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={formData.test_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      test_id: Number(e.target.value),
                    })
                  }
                >
                  <option value="">-- Select Test --</option>
                  {tests.map((t) => (
                    <option key={t.test_id} value={t.test_id}>
                      {t.test_name} ({t.test_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Parameter Name *
                </label>
                <input
                  required
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={formData.parameter_name}
                  onChange={(e) =>
                    setFormData({ ...formData, parameter_name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    value={formData.unit || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Normal Range
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    value={formData.normal_range || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, normal_range: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parameter ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Test Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parameter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Normal Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parameters.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.parameter_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {p.test_name ||
                    tests.find((t) => t.test_id === p.test_id)?.test_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {p.parameter_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.unit || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.normal_range || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    onClick={() => handleEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={async () => {
                      if (window.confirm("Are you sure?")) {
                        await deleteTestParameter(p.parameter_id!);
                        reload();
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {parameters.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-gray-500 text-sm"
                >
                  No parameters found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LabTestManagementPage;
