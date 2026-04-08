import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Activity, Clock, IndianRupee, Beaker, FileText, ChevronRight, CheckCircle, Info } from "lucide-react";

import { handleApiError } from "../services/api";
import { useToast } from "../hooks/useToast";
import { fetchLabTests, fetchLabCategories, fetchLabTestDetails, LabTest, LabTestCategory } from "../services/labService";
import { getAllLabs } from "../services/admin_api";
import { LabList } from "../types";

export const BookLabTestPage: React.FC = () => {
  const toast = useToast();

  // Search & Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLab, setSelectedLab] = useState<string>("");

  // Detail Modal State
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // --- Queries ---

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<LabTestCategory[], Error>({
    queryKey: ["labCategories"],
    queryFn: () => fetchLabCategories({ is_active: true }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: labs = [], isLoading: labsLoading } = useQuery<LabList[], Error>({
    queryKey: ["allLabs"],
    queryFn: () => getAllLabs(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: tests = [],
    isLoading: testsLoading,
    isError: testsError,
    error: testsQueryError,
  } = useQuery<LabTest[], Error>({
    queryKey: ["labTests", debouncedSearch, selectedCategory, selectedLab],
    queryFn: () =>
      fetchLabTests({
        search: debouncedSearch || undefined,
        category_id: selectedCategory || undefined,
        lab_id: selectedLab || undefined,
      }),
    staleTime: 1 * 60 * 1000,
  });

  useEffect(() => {
    if (testsQueryError) toast.error(handleApiError(testsQueryError));
  }, [testsQueryError, toast]);

  // Details Query
  const {
    data: testDetails,
    isLoading: detailsLoading,
  } = useQuery<LabTest, Error>({
    queryKey: ["labTestDetails", selectedTestId],
    queryFn: () => fetchLabTestDetails(selectedTestId!),
    enabled: !!selectedTestId,
  });

  const getCategoryName = (id?: number) => {
    if (!id) return "Uncategorized";
    const cat = categories.find((c) => c.category_id === id);
    return cat ? cat.category_name : "Unknown Category";
  };

  const getLabName = (id?: string) => {
    if (!id) return "Unknown Lab";
    const lab = labs.find((l) => l.lab_id === id); // Fallback depending on ID used
    return lab ? lab.lab_name : "Lab " + id.substring(0, 4);
  };

  const handleBook = (test: LabTest) => {
    toast.success(`Booking process initiated for ${test.test_name}. Check-out functional logic pending backend integration!`);
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Book Lab Test</h2>
        <p className="text-slate-600">Search for specialized diagnostic tests, compare prices, and book easily.</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by test name or code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm appearance-none"
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
            >
              <option value="">All Labs</option>
              {labs.filter(l => String(l.verification_status).toUpperCase() === "VERIFIED").map((lab) => (
                <option key={lab.lab_id} value={lab.lab_id}>
                  {lab.lab_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      {testsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-3 bg-slate-50 rounded w-full"></div>
                <div className="h-3 bg-slate-50 rounded w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : testsError ? (
        <div className="bg-red-50 text-red-600 rounded-xl p-6 text-center border border-red-100">
          Failed to load lab tests. Please try again.
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Tests Found</h3>
          <p className="text-slate-500">We couldn't find any tests matching your criteria. Try adjusting the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div
              key={test.test_id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{test.test_name}</h3>
                    <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">{test.test_code}</p>
                    {test.created_by_name && (
                      <p className="font-medium text-xs text-slate-800 mt-0.5 flex items-center gap-1">
                        <span className="font-medium inline-block w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        {test.created_by_name}
                      </p>
                    )}
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                    <IndianRupee size={14} />
                    {test.price}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                      <ActiityIconForCategory categoryName={getCategoryName(test.category_id)} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Category</p>
                      <p className="font-medium text-slate-700">{getCategoryName(test.category_id)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Turnaround Time</p>
                      <p className="font-medium text-slate-700">{test.turnaround_hours ? `${test.turnaround_hours} Hours` : "Standard"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Sample Type</p>
                      <p className="font-medium text-slate-700">{test.sample_type || "Blood"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
                  <p className="line-clamp-2">{test.description || "No description provided for this test."}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 p-4 bg-slate-50 flex gap-3">
                <button
                  onClick={() => setSelectedTestId(test.test_id!)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Info size={16} />
                  Details
                </button>
                <button
                  onClick={() => handleBook(test)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  Book Now
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedTestId && (
        <div 
          className="fixed inset-0 z-50 flex justify-center items-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => setSelectedTestId(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {detailsLoading ? (
               <div className="p-12 text-center text-slate-500 animate-pulse">Loading details...</div>
            ) : testDetails ? (
              <>
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      <h3 className="text-2xl font-bold text-slate-800">{testDetails.test_name}</h3>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">
                        {testDetails.test_code}
                      </span>
                    </div>
                    <p className="text-slate-500">{getCategoryName(testDetails.category_id)}</p>
                    {testDetails.created_by_name && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Offered by <span className="font-medium text-slate-600 ml-1">{testDetails.created_by_name}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-emerald-600 flex items-center justify-end">
                      <IndianRupee size={24} strokeWidth={3} />
                      {testDetails.price}
                    </p>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">Fasting Required</p>
                      <p className="font-semibold text-slate-700">
                        {testDetails.fasting_required ? `Yes, ${testDetails.fasting_hours || 8} Hours` : "No"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">Sample Type</p>
                      <p className="font-semibold text-slate-700">{testDetails.sample_type}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">Turnaround Time</p>
                      <p className="font-semibold text-slate-700">{testDetails.turnaround_hours ? `${testDetails.turnaround_hours} Hours` : "Standard"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <p className="font-semibold text-slate-700 flex items-center gap-1">
                        {testDetails.is_active !== false ? (
                          <><CheckCircle size={14} className="text-emerald-500"/>  Available</>
                        ) : (
                          <span className="text-red-500">Unavailable</span>
                        )}
                      </p>
                    </div>
                    {testDetails.created_by_name && (
                      <div className="col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-xs text-emerald-500 mb-1">Laboratory</p>
                        <p className="font-semibold text-emerald-800">{testDetails.created_by_name}</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Description</h4>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {testDetails.description || "No detailed description available."}
                    </p>
                  </div>

                  {testDetails.parameters && testDetails.parameters.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Test Parameters</h4>
                      <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100 text-slate-500">
                            <tr>
                              <th className="px-4 py-3 font-medium">Parameter</th>
                              <th className="px-4 py-3 font-medium">Normal Range</th>
                              <th className="px-4 py-3 font-medium">Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {testDetails.parameters.map(p => (
                              <tr key={p.parameter_id} className="bg-white">
                                <td className="px-4 py-3 font-medium text-slate-700">{p.parameter_name}</td>
                                <td className="px-4 py-3 text-slate-600">{p.normal_range || "N/A"}</td>
                                <td className="px-4 py-3 text-slate-500">{p.unit || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end rounded-b-2xl">
                  <button 
                    onClick={() => setSelectedTestId(null)}
                    className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                       handleBook(testDetails);
                       setSelectedTestId(null);
                    }}
                    className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-sm transition-colors"
                  >
                    Proceed to Book
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-red-500">Failed to load test details.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

function ActiityIconForCategory({ categoryName }: { categoryName: string }) {
  const name = categoryName.toLowerCase();
  if (name.includes('blood') || name.includes('hematology')) return <Activity size={16} />;
  if (name.includes('urine') || name.includes('microscopy')) return <Beaker size={16} />;
  if (name.includes('pathology') || name.includes('biopsy')) return <Search size={16} />;
  return <Activity size={16} />;
}

export default BookLabTestPage;
