// src/pages/BookLabTestPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // ← add
import {
  Search,
  Filter,
  Activity,
  Clock,
  IndianRupee,
  FileText,
  ChevronRight,
  CheckCircle,
  Info,
  X,
  Home,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  MapPin,
  FlaskConical,
  Stethoscope,
} from "lucide-react";

import { handleApiError } from "../services/api";
import { useToast } from "../hooks/useToast";
import {
  fetchLabTests,
  fetchLabCategories,
  fetchLabTestDetails,
  createLabBooking,
  fetchLabSlots,
  LabTest,
  LabTestCategory,
  LabSlot,
  CollectionType,
  CollectionAddress,
} from "../services/labService";
import { getAllLabs } from "../services/admin_api";
import { LabList } from "../types";
import PaymentButton from "../components/PaymentButton";
import { useAuth } from "../context/AuthContext"; // ← add

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt12(t?: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const HOME_COLLECTION_FEE = 50;

type WizardStep = "slot" | "collection" | "summary";

interface BookingWizardState {
  test: LabTest;
  labId: string;
  labName: string;
}

// ── main component ────────────────────────────────────────────────────────────

export const BookLabTestPage: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // ← add
  const { user } = useAuth(); // ← add

  // ── filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLab, setSelectedLab] = useState<string>("");

  // ── detail modal ──────────────────────────────────────────────────────────
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  // ── booking wizard ────────────────────────────────────────────────────────
  const [wizardState, setWizardState] = useState<BookingWizardState | null>(
    null,
  );
  const [wizardStep, setWizardStep] = useState<WizardStep>("slot");

  // slot selection
  const [slotDate, setSlotDate] = useState<string>(todayISO());
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<LabSlot | null>(null);

  // collection
  const [collectionType, setCollectionType] =
    useState<CollectionType>("lab_visit");
  const [homeAddress, setHomeAddress] = useState<CollectionAddress>({
    address_line1: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  // notes
  const [notes, setNotes] = useState("");

  // ── payment: booking_id is only known AFTER createLabBooking succeeds ──── // ← add
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null); // ← add

  // debounce search
  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(h);
  }, [search]);

  // ── queries ───────────────────────────────────────────────────────────────

  const { data: categories = [] } = useQuery<LabTestCategory[], Error>({
    queryKey: ["labCategories"],
    queryFn: () => fetchLabCategories({ is_active: true }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: labs = [] } = useQuery<LabList[], Error>({
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
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (testsQueryError) toast.error(handleApiError(testsQueryError));
  }, [testsQueryError, toast]);

  const { data: testDetails, isLoading: detailsLoading } = useQuery<
    LabTest,
    Error
  >({
    queryKey: ["labTestDetails", selectedTestId],
    queryFn: () => fetchLabTestDetails(selectedTestId!),
    enabled: !!selectedTestId,
  });

  // ── booking mutation ──────────────────────────────────────────────────────

  const { mutate: doBook, isPending: booking } = useMutation({
    mutationFn: createLabBooking,
    onSuccess: (data: any) => {
      // ← changed
      // Store booking_id so PaymentButton can use it.             // ← add
      // Do NOT close the wizard here — payment step comes next.   // ← add
      setCreatedBookingId(data?.booking_id ?? data?.data?.booking_id ?? null); // ← add
      queryClient.invalidateQueries({ queryKey: ["myLabBookings"] });
    },
    onError: (err) => toast.error(handleApiError(err)),
  });

  // ── wizard helpers ────────────────────────────────────────────────────────

  const openWizard = useCallback(
    (test: LabTest) => {
      const labId = test.created_by || selectedLab || "";
      const labName = test.created_by_name ?? "Unknown Lab";
      setWizardState({ test, labId, labName });
      setWizardStep("slot");
      setSlotDate(todayISO());
      setSelectedSlotId(null);
      setSelectedSlot(null);
      setCollectionType("lab_visit");
      setHomeAddress({
        address_line1: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
      });
      setNotes("");
      setCreatedBookingId(null); // ← add
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [selectedLab],
  );

  const closeWizard = useCallback(() => {
    setWizardState(null);
    setSelectedTestId(null);
    setSelectedSlot(null);
    setCreatedBookingId(null); // ← add
  }, []);

  const handleConfirmBook = () => {
    if (!wizardState || !selectedSlotId) return;

    const payload: any = {
      lab_id: wizardState.labId,
      slot_id: selectedSlotId,
      test_id: wizardState.test.test_id!,
      collection_type: collectionType,
      notes: notes || undefined,
    };

    if (collectionType === "home") {
      payload.collection_address = homeAddress;
    }

    doBook(payload);
  };

  // ── payment success handler ───────────────────────────────────────────────  // ← add block
  const handlePaymentSuccess = (referenceId: string) => {
    toast.success("Payment successful! Lab test booking confirmed.");
    queryClient.invalidateQueries({ queryKey: ["myLabBookings"] });
    closeWizard();
    navigate(`/lab-bookings/${referenceId}/confirmed`);
  };

  // ── misc ──────────────────────────────────────────────────────────────────

  const getCategoryName = (id?: number) => {
    if (!id) return "Uncategorized";
    const cat = categories.find((c) => c.category_id === id);
    return cat ? cat.category_name : "Unknown Category";
  };

  const verifiedLabs = labs.filter(
    (l) => String(l.verification_status).toUpperCase() === "VERIFIED",
  );

  const subtotal = wizardState ? Number(wizardState.test.price) : 0;
  const homeCharge = collectionType === "home" ? HOME_COLLECTION_FEE : 0;
  const totalAmount = subtotal + homeCharge;

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Page header ── */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Book Lab Test
        </h2>
        <p className="text-slate-600">
          Search for specialized diagnostic tests, compare prices, and book
          easily.
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by test name or code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
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
            <Activity
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <select
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm appearance-none"
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
            >
              <option value="">All Labs</option>
              {verifiedLabs.map((lab) => (
                <option key={lab.lab_id} value={lab.lab_id}>
                  {lab.lab_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Tests grid ── */}
      {testsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-4" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-6" />
              <div className="space-y-3">
                <div className="h-3 bg-slate-50 rounded w-full" />
                <div className="h-3 bg-slate-50 rounded w-4/5" />
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
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No Tests Found
          </h3>
          <p className="text-slate-500">
            We couldn't find any tests matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tests.map((test) => (
            <TestCard
              key={test.test_id}
              test={test}
              categoryName={getCategoryName(test.category_id)}
              onDetails={() => setSelectedTestId(test.test_id!)}
              onBook={() => openWizard(test)}
            />
          ))}
        </div>
      )}

      {/* ── Test detail modal ── */}
      {selectedTestId && !wizardState && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => setSelectedTestId(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {detailsLoading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <span>Loading details…</span>
              </div>
            ) : testDetails ? (
              <TestDetailModal
                test={testDetails}
                categoryName={getCategoryName(testDetails.category_id)}
                onClose={() => setSelectedTestId(null)}
                onBook={() => {
                  setSelectedTestId(null);
                  openWizard(testDetails);
                }}
              />
            ) : (
              <div className="p-12 text-center text-red-500">
                Failed to load test details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Booking wizard ── */}
      {wizardState && (
        <BookingWizardModal
          wizardState={wizardState}
          step={wizardStep}
          setStep={setWizardStep}
          slotDate={slotDate}
          setSlotDate={setSlotDate}
          selectedSlotId={selectedSlotId}
          setSelectedSlotId={setSelectedSlotId}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          collectionType={collectionType}
          setCollectionType={setCollectionType}
          homeAddress={homeAddress}
          setHomeAddress={setHomeAddress}
          notes={notes}
          setNotes={setNotes}
          subtotal={subtotal}
          homeCharge={homeCharge}
          totalAmount={totalAmount}
          booking={booking}
          onConfirm={handleConfirmBook}
          onClose={closeWizard}
          createdBookingId={createdBookingId} // ← add
          patientEmail={user?.email ?? ""} // ← add
          onPaymentSuccess={handlePaymentSuccess} // ← add
          onPaymentError={(msg) => toast.error(msg)} // ← add
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TestCard  — unchanged
// ─────────────────────────────────────────────────────────────────────────────

function TestCard({
  test,
  categoryName,
  onDetails,
  onBook,
}: {
  test: LabTest;
  categoryName: string;
  onDetails: () => void;
  onBook: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 line-clamp-1">
              {test.test_name}
            </h3>
            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">
              {test.test_code}
            </p>
            {test.created_by_name && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Building2 size={11} />
                {test.created_by_name}
              </p>
            )}
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 shrink-0">
            <IndianRupee size={13} />
            {Number(test.price).toFixed(0)}
          </div>
        </div>
        <div className="space-y-2.5 mb-5">
          <InfoRow
            icon={<FlaskConical size={14} />}
            label="Category"
            value={categoryName}
          />
          <InfoRow
            icon={<Clock size={14} />}
            label="Turnaround"
            value={
              test.turnaround_hours ? `${test.turnaround_hours}h` : "Standard"
            }
          />
          <InfoRow
            icon={<FileText size={14} />}
            label="Sample"
            value={test.sample_type || "Blood"}
          />
          {test.fasting_required && (
            <InfoRow
              icon={<AlertCircle size={14} className="text-amber-500" />}
              label="Fasting"
              value={`Required — ${test.fasting_hours ?? 8}h`}
              valueClass="text-amber-600 font-semibold"
            />
          )}
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
          <p className="line-clamp-2">
            {test.description || "No description provided for this test."}
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 p-4 bg-slate-50 flex gap-3">
        <button
          onClick={onDetails}
          className="flex-1 py-2.5 px-4 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <Info size={15} />
          Details
        </button>
        <button
          onClick={onBook}
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200 flex items-center justify-center gap-2"
        >
          Book Now
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueClass = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`font-medium text-slate-700 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TestDetailModal  — unchanged
// ─────────────────────────────────────────────────────────────────────────────

function TestDetailModal({
  test,
  categoryName,
  onClose,
  onBook,
}: {
  test: LabTest;
  categoryName: string;
  onClose: () => void;
  onBook: () => void;
}) {
  return (
    <>
      <div className="p-6 border-b border-slate-100 flex justify-between items-start">
        <div>
          <div className="flex gap-2 items-center mb-1">
            <h3 className="text-2xl font-bold text-slate-800">
              {test.test_name}
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">
              {test.test_code}
            </span>
          </div>
          <p className="text-slate-500">{categoryName}</p>
          {test.created_by_name && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Building2 size={12} />
              Offered by{" "}
              <span className="font-medium text-slate-600 ml-1">
                {test.created_by_name}
              </span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-emerald-600 flex items-center justify-end">
            <IndianRupee size={24} strokeWidth={3} />
            {Number(test.price).toFixed(0)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">base price</p>
        </div>
      </div>
      <div className="p-6 overflow-y-auto flex-1">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <MetaTile
            label="Fasting Required"
            value={
              test.fasting_required ? `Yes — ${test.fasting_hours ?? 8}h` : "No"
            }
          />
          <MetaTile label="Sample Type" value={test.sample_type} />
          <MetaTile
            label="Turnaround Time"
            value={
              test.turnaround_hours
                ? `${test.turnaround_hours} Hours`
                : "Standard"
            }
          />
          <MetaTile
            label="Status"
            value={test.is_active !== false ? "Available ✓" : "Unavailable"}
          />
          {test.created_by_name && (
            <div className="col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-500 mb-1">Laboratory</p>
              <p className="font-semibold text-emerald-800">
                {test.created_by_name}
              </p>
            </div>
          )}
        </div>
        <div className="mb-8">
          <h4 className="text-lg font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">
            Description
          </h4>
          <p className="text-slate-600 leading-relaxed text-sm">
            {test.description || "No detailed description available."}
          </p>
        </div>
        {test.parameters && test.parameters.length > 0 && (
          <div>
            <h4 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">
              Test Parameters
            </h4>
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
                  {test.parameters.map((p) => (
                    <tr key={p.parameter_id} className="bg-white">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {p.parameter_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.normal_range || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.unit || "—"}
                      </td>
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
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
        >
          Close
        </button>
        <button
          onClick={onBook}
          className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2"
        >
          Proceed to Book <ChevronRight size={16} />
        </button>
      </div>
    </>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-slate-700">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BookingWizardModal
// ─────────────────────────────────────────────────────────────────────────────

function BookingWizardModal({
  wizardState,
  step,
  setStep,
  slotDate,
  setSlotDate,
  selectedSlotId,
  setSelectedSlotId,
  selectedSlot,
  setSelectedSlot,
  collectionType,
  setCollectionType,
  homeAddress,
  setHomeAddress,
  notes,
  setNotes,
  subtotal,
  homeCharge,
  totalAmount,
  booking,
  onConfirm,
  onClose,
  createdBookingId, // ← add
  patientEmail, // ← add
  onPaymentSuccess, // ← add
  onPaymentError, // ← add
}: {
  wizardState: BookingWizardState;
  step: WizardStep;
  setStep: (s: WizardStep) => void;
  slotDate: string;
  setSlotDate: (d: string) => void;
  selectedSlotId: number | null;
  setSelectedSlotId: (id: number | null) => void;
  selectedSlot: LabSlot | null;
  setSelectedSlot: (slot: LabSlot | null) => void;
  collectionType: CollectionType;
  setCollectionType: (t: CollectionType) => void;
  homeAddress: CollectionAddress;
  setHomeAddress: (a: CollectionAddress) => void;
  notes: string;
  setNotes: (n: string) => void;
  subtotal: number;
  homeCharge: number;
  totalAmount: number;
  booking: boolean;
  onConfirm: () => void;
  onClose: () => void;
  createdBookingId: string | null; // ← add
  patientEmail: string; // ← add
  onPaymentSuccess: (referenceId: string) => void; // ← add
  onPaymentError: (msg: string) => void; // ← add
}) {
  const steps: { key: WizardStep; label: string }[] = [
    { key: "slot", label: "Pick Slot" },
    { key: "collection", label: "Collection" },
    { key: "summary", label: "Confirm" },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  const canNext =
    step === "slot"
      ? !!selectedSlotId
      : step === "collection"
        ? collectionType === "lab_visit" ||
          (!!homeAddress.address_line1 && !!homeAddress.city)
        : true;

  const next = () => {
    if (step === "slot") setStep("collection");
    if (step === "collection") setStep("summary");
  };
  const back = () => {
    if (step === "collection") setStep("slot");
    if (step === "summary") setStep("collection");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-widest mb-1">
                Book Lab Test
              </p>
              <h2 className="text-xl font-bold leading-tight">
                {wizardState.test.test_name}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5 flex items-center gap-1">
                <Building2 size={12} /> {wizardState.labName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${i === stepIndex ? "bg-white text-emerald-700" : i < stepIndex ? "bg-emerald-500/60 text-white" : "bg-white/20 text-emerald-100"}`}
                >
                  {i < stepIndex ? (
                    <CheckCircle size={11} />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                  {s.label}
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight size={13} className="text-emerald-200" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="overflow-y-auto flex-1 p-6">
          {step === "slot" && (
            <SlotStep
              labId={wizardState.labId}
              slotDate={slotDate}
              setSlotDate={setSlotDate}
              selectedSlotId={selectedSlotId}
              setSelectedSlotId={setSelectedSlotId}
              setSelectedSlot={setSelectedSlot}
            />
          )}
          {step === "collection" && (
            <CollectionStep
              collectionType={collectionType}
              setCollectionType={setCollectionType}
              homeAddress={homeAddress}
              setHomeAddress={setHomeAddress}
              notes={notes}
              setNotes={setNotes}
            />
          )}
          {step === "summary" && (
            <SummaryStep
              wizardState={wizardState}
              slotDate={slotDate}
              selectedSlot={selectedSlot}
              collectionType={collectionType}
              homeAddress={homeAddress}
              notes={notes}
              subtotal={subtotal}
              homeCharge={homeCharge}
              totalAmount={totalAmount}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 flex justify-between items-center bg-slate-50">
          <button
            onClick={step === "slot" ? onClose : back}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors text-sm"
          >
            {step === "slot" ? "Cancel" : "← Back"}
          </button>

          {step !== "summary" ? (
            <button
              onClick={next}
              disabled={!canNext}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2 shadow-sm"
            >
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            // ── Payment footer: two-step — create booking first, then pay ──
            <div className="flex items-center gap-3">
              {" "}
              {/* ← changed */}
              {!createdBookingId ? (
                // Step 1: Create the booking record
                <button
                  onClick={onConfirm}
                  disabled={booking}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors text-sm flex items-center gap-2 shadow-sm"
                >
                  {booking ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Booking…
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} /> Confirm Booking
                    </>
                  )}
                </button>
              ) : (
                // Step 2: Booking created — now pay with the real booking_id
                <PaymentButton
                  paymentFor="LAB_TEST"
                  referenceId={createdBookingId}
                  label={`Pay ₹${totalAmount}`}
                  patientName={patientEmail}
                  patientEmail={patientEmail}
                  patientPhone=""
                  onSuccess={onPaymentSuccess}
                  onError={onPaymentError}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Slot selection  — unchanged ──────────────────────────────────────

function SlotStep({
  labId,
  slotDate,
  setSlotDate,
  selectedSlotId,
  setSelectedSlotId,
  setSelectedSlot,
}: {
  labId: string;
  slotDate: string;
  setSlotDate: (d: string) => void;
  selectedSlotId: number | null;
  setSelectedSlotId: (id: number | null) => void;
  setSelectedSlot: (slot: LabSlot | null) => void;
}) {
  const {
    data: slots = [],
    isLoading,
    isError,
  } = useQuery<LabSlot[], Error>({
    queryKey: ["labSlots", labId, slotDate],
    queryFn: () => fetchLabSlots(labId, slotDate),
    enabled: !!labId && !!slotDate,
  });

  return (
    <div>
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-emerald-600" />
        Select Date & Time Slot
      </h3>
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Appointment Date
        </label>
        <input
          type="date"
          min={todayISO()}
          value={slotDate}
          onChange={(e) => {
            setSlotDate(e.target.value);
            setSelectedSlotId(null);
            setSelectedSlot(null);
          }}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 text-sm transition-all"
        />
      </div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Available Time Slots
      </label>
      {isLoading ? (
        <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
          <Loader2 className="animate-spin text-emerald-500" size={24} />
          <p className="text-sm">Fetching available slots...</p>
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm border border-red-100">
          Failed to load slots.
        </div>
      ) : slots.length === 0 ? (
        <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <Clock className="mx-auto text-slate-300 mb-2" size={24} />
          <p className="text-sm text-slate-500 font-medium">
            No slots available for this date.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Please try another date or contact the lab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {slots.map((slot) => {
            const isSelected = selectedSlotId === slot.slot_id;
            return (
              <button
                key={slot.slot_id}
                onClick={() => {
                  setSelectedSlotId(slot.slot_id);
                  setSelectedSlot(slot);
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${isSelected ? "border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-100" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"}`}
              >
                <p
                  className={`font-bold text-sm ${isSelected ? "text-emerald-700" : "text-slate-700"}`}
                >
                  {fmt12(slot.start_time)}
                </p>
                <p
                  className={`text-xs ${isSelected ? "text-emerald-500" : "text-slate-400"}`}
                >
                  — {fmt12(slot.end_time)}
                </p>
                {isSelected && (
                  <CheckCircle size={14} className="text-emerald-500 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      )}
      {!selectedSlotId && (
        <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
          <AlertCircle size={12} /> Please select a time slot to continue.
        </p>
      )}
    </div>
  );
}

// ── Step 2: Collection  — unchanged ──────────────────────────────────────────

function CollectionStep({
  collectionType,
  setCollectionType,
  homeAddress,
  setHomeAddress,
  notes,
  setNotes,
}: {
  collectionType: CollectionType;
  setCollectionType: (t: CollectionType) => void;
  homeAddress: CollectionAddress;
  setHomeAddress: (a: CollectionAddress) => void;
  notes: string;
  setNotes: (n: string) => void;
}) {
  const field = (key: keyof CollectionAddress) => ({
    value: homeAddress[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setHomeAddress({ ...homeAddress, [key]: e.target.value }),
  });

  return (
    <div>
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <MapPin size={18} className="text-emerald-600" />
        Collection Method
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(["lab_visit", "home"] as CollectionType[]).map((t) => {
          const active = collectionType === t;
          return (
            <button
              key={t}
              onClick={() => setCollectionType(t)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${active ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <div
                className={`mb-2 ${active ? "text-emerald-600" : "text-slate-400"}`}
              >
                {t === "lab_visit" ? (
                  <Building2 size={22} />
                ) : (
                  <Home size={22} />
                )}
              </div>
              <p
                className={`font-semibold text-sm ${active ? "text-emerald-700" : "text-slate-700"}`}
              >
                {t === "lab_visit" ? "Lab Visit" : "Home Collection"}
              </p>
              <p
                className={`text-xs mt-0.5 ${active ? "text-emerald-500" : "text-slate-400"}`}
              >
                {t === "lab_visit" ? "Visit the lab" : "+ ₹50 charge"}
              </p>
            </button>
          );
        })}
      </div>
      {collectionType === "home" && (
        <div className="space-y-3 mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Home size={12} /> Home Collection Address
          </p>
          <input
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
            placeholder="Address Line 1 *"
            {...field("address_line1")}
          />
          <input
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
            placeholder="Landmark (optional)"
            {...field("landmark")}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
              placeholder="City *"
              {...field("city")}
            />
            <input
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
              placeholder="State"
              {...field("state")}
            />
          </div>
          <input
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
            placeholder="Pincode"
            {...field("pincode")}
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Notes / Special Instructions (optional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all resize-none"
          placeholder="Any allergies, previous reports, or special instructions…"
        />
      </div>
    </div>
  );
}

// ── Step 3: Summary  — unchanged ─────────────────────────────────────────────

function SummaryStep({
  wizardState,
  slotDate,
  selectedSlot,
  collectionType,
  homeAddress,
  notes,
  subtotal,
  homeCharge,
  totalAmount,
}: {
  wizardState: BookingWizardState;
  slotDate: string;
  selectedSlot: LabSlot | null;
  collectionType: CollectionType;
  homeAddress: CollectionAddress;
  notes: string;
  subtotal: number;
  homeCharge: number;
  totalAmount: number;
}) {
  return (
    <div className="space-y-5">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Stethoscope size={18} className="text-emerald-600" />
        Booking Summary
      </h3>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Test
        </p>
        <p className="font-bold text-slate-800">{wizardState.test.test_name}</p>
        <p className="text-sm text-slate-500">
          {wizardState.test.test_code} · {wizardState.test.sample_type}
        </p>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <Building2 size={11} /> {wizardState.labName}
        </p>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Appointment
        </p>
        <div className="flex gap-4 flex-wrap">
          <div>
            <p className="text-xs text-slate-400">Date</p>
            <p className="font-semibold text-slate-700">{slotDate}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Time</p>
            <p className="font-semibold text-slate-700">
              {selectedSlot
                ? `${fmt12(selectedSlot.start_time)} – ${fmt12(selectedSlot.end_time)}`
                : "—"}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Collection
        </p>
        <div className="flex items-center gap-2">
          {collectionType === "lab_visit" ? (
            <Building2 size={15} className="text-slate-500" />
          ) : (
            <Home size={15} className="text-amber-500" />
          )}
          <p className="font-semibold text-slate-700 capitalize">
            {collectionType.replace("_", " ")}
          </p>
        </div>
        {collectionType === "home" && homeAddress.address_line1 && (
          <p className="text-xs text-slate-500 mt-1">
            {homeAddress.address_line1}, {homeAddress.city}{" "}
            {homeAddress.pincode}
          </p>
        )}
      </div>
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">
          Price Breakdown
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Test Price</span>
            <span className="flex items-center">
              <IndianRupee size={13} />
              {subtotal.toFixed(2)}
            </span>
          </div>
          {homeCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Home Collection</span>
              <span className="flex items-center text-amber-600">
                <IndianRupee size={13} />
                {homeCharge.toFixed(2)}
              </span>
            </div>
          )}
          <div className="border-t border-emerald-200 pt-2 flex justify-between font-bold text-emerald-800 text-base">
            <span>Total</span>
            <span className="flex items-center">
              <IndianRupee size={15} strokeWidth={2.5} />
              {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      {notes && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">
            Your Notes
          </p>
          <p className="text-sm text-slate-600">{notes}</p>
        </div>
      )}
    </div>
  );
}

export default BookLabTestPage;
