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
} from "../services/labService";

const LabTestManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "categories" | "tests" | "parameters"
  >("categories");

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
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Lab Test Management
      </h1>

      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 font-medium rounded-lg shadow-sm transition-colors ${activeTab === "categories" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
        <button
          className={`px-4 py-2 font-medium rounded-lg shadow-sm transition-colors ${activeTab === "tests" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          onClick={() => setActiveTab("tests")}
        >
          Tests
        </button>
        {/* <button
          className={`px-4 py-2 font-medium rounded-lg shadow-sm transition-colors ${activeTab === "parameters" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          onClick={() => setActiveTab("parameters")}
        >
          Parameters
        </button> */}
      </div>

      {error && (
        <div className="text-red-500 mb-4 bg-red-100 p-3 rounded-lg border border-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {activeTab === "categories" ? (
            <CategoryList categories={categories} reload={loadData} />
          ) : activeTab === "tests" ? (
            <TestList tests={tests} categories={categories} reload={loadData} />
          ) : (
            <ParameterList
              parameters={parameters}
              tests={tests}
              reload={loadData}
            />
          )}
        </div>
      )}
    </div>
  );
};

// --- Category List Component ---
const CategoryList: React.FC<{
  categories: LabTestCategory[];
  reload: () => void;
}> = ({ categories, reload }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
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
      alert("Error fetching category details: " + (err.message || "Unknown error"));
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
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700">Lab Categories</h2>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
          onClick={handleAddClick}
        >
          + Add Category
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">{editingCategoryId ? "Edit Category" : "Add New Category"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <input
                  required
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.category_name}
                  onChange={(e) =>
                    setFormData({ ...formData, category_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="category_is_active"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label
                  htmlFor="category_is_active"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Is Active
                </label>
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

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {categories.map((c, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {c.category_id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {c.category_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                {c.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  className="text-blue-600 hover:text-blue-900 mr-3"
                  onClick={() => handleEditClick(c)}
                >
                  Edit
                </button>
                <button
                  className="text-red-600 hover:text-red-900"
                  onClick={async () => {
                    if (window.confirm("Are you sure?")) {
                      await deleteLabCategory(c.category_id!);
                      reload();
                    }
                  }}
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
                className="px-6 py-10 text-center text-gray-500 text-sm"
              >
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Test List Component ---
const TestList: React.FC<{
  tests: LabTest[];
  categories: LabTestCategory[];
  reload: () => void;
}> = ({ tests, categories, reload }) => {
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
      alert(`Error ${editingTestId ? 'updating' : 'creating'} test: ` + (err.message || "Unknown error"));
    }
  };

  return (
    <div>
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700">Lab Tests</h2>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
          onClick={handleAddClick}
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
                    Turnaround Turn
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {viewTestDetails.turnaround_hours
                      ? `${viewTestDetails.turnaround_hours} hours`
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 py-4 px-2">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingTestId ? "Edit Lab Test" : "Add New Lab Test"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Test Code *
                  </label>
                  <input
                    required
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    value={formData.test_code}
                    onChange={(e) =>
                      setFormData({ ...formData, test_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Test Name *
                  </label>
                  <input
                    required
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    value={formData.test_name}
                    onChange={(e) =>
                      setFormData({ ...formData, test_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
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
                  <label className="block text-sm font-medium text-gray-700">
                    Price *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
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
                  <label className="block text-sm font-medium text-gray-700">
                    Sample Type *
                  </label>
                  <input
                    required
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    value={formData.sample_type}
                    onChange={(e) =>
                      setFormData({ ...formData, sample_type: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Turnaround Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
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
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
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
                  <label className="block text-sm font-medium text-gray-700">
                    Fasting Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!formData.fasting_required}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500"
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
                Test Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tests.map((t, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {t.test_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {t.test_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {categories.find((c) => c.category_id === t.category_id)
                    ?.category_name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {t.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                  <button
                    className="text-indigo-600 font-medium hover:text-indigo-900 mr-3 flex items-center"
                    onClick={() => handleViewDetails(t.test_id!)}
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Details
                  </button>
                  <button 
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    onClick={() => handleEditClick(t.test_id!)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={async () => {
                      if (window.confirm("Are you sure?")) {
                        await deleteLabTest(t.test_id!);
                        reload();
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {tests.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-gray-500 text-sm"
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
};

export default LabTestManagementPage;

// --- Parameter List Component ---
const ParameterList: React.FC<{
  parameters: TestParameter[];
  tests: LabTest[];
  reload: () => void;
}> = ({ parameters, tests, reload }) => {
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
};
