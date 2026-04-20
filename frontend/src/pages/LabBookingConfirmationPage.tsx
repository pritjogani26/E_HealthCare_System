import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Calendar,
  MapPin,
  IndianRupee,
  Building2,
  FlaskConical,
  ChevronRight,
  Loader2,
  Home,
} from "lucide-react";

import { fetchLabBooking } from "../services/labService";

const LabBookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const {
    data: booking,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["labBookingDetails", bookingId],
    queryFn: () => fetchLabBooking(bookingId!),
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
          <p className="text-slate-500 font-medium">
            Loading booking details...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Booking Not Found
          </h2>
          <p className="text-slate-500 mb-6">
            We couldn't retrieve the details for this booking.
          </p>
          <button
            onClick={() => navigate("/my-lab-bookings")}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-colors"
          >
            Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-600 px-8 py-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 opacity-10">
                <CheckCircle size={200} />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle className="text-emerald-500 w-12 h-12" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Booking Confirmed!
                </h1>
                <p className="text-emerald-100 font-medium">
                  Your lab test has been successfully scheduled.
                </p>
                <div className="mt-4 px-4 py-1.5 bg-white/20 rounded-full text-white font-medium text-sm inline-block">
                  ID: {booking.booking_id.split("-")[0].toUpperCase()}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <FlaskConical size={20} className="text-emerald-600" />
                Test Details
              </h3>

              <div className="grid gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <Building2
                      size={24}
                      className="text-slate-500"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">
                      Laboratory
                    </p>
                    <p className="font-bold text-slate-800 text-lg">
                      {booking.lab_name}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <FlaskConical
                      size={24}
                      className="text-emerald-600"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">
                      Test Name
                    </p>
                    <p className="font-bold text-slate-800 text-lg">
                      {booking.test_name}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {booking.test_code} • {booking.sample_type}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">
                      Appointment Time
                    </p>
                    <p className="font-bold text-slate-800 text-lg">
                      {booking.slot_date}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {booking.start_time} - {booking.end_time}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    {booking.collection_type === "home" ? (
                      <Home size={24} className="text-amber-600" />
                    ) : (
                      <MapPin size={24} className="text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">
                      Collection Method
                    </p>
                    <p className="font-bold text-slate-800 text-lg capitalize">
                      {booking.collection_type.replace("_", " ")}
                    </p>
                    {booking.collection_type === "home" &&
                      typeof booking.collection_address === "object" &&
                      booking.collection_address !== null && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          {(booking.collection_address as any).address_line1},{" "}
                          {(booking.collection_address as any).city}
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-3">
                  Payment Summary
                </h3>
                <div className="space-y-3 mb-3">
                  <div className="flex justify-between text-slate-600 text-sm font-medium">
                    <span>Test Price</span>
                    <span className="flex items-center">
                      <IndianRupee size={12} className="mr-0.5" />
                      {booking.subtotal}
                    </span>
                  </div>
                  {Number(booking.home_collection_charge) > 0 && (
                    <div className="flex justify-between text-slate-600 text-sm font-medium">
                      <span>Home Collection</span>
                      <span className="flex items-center">
                        <IndianRupee size={12} className="mr-0.5" />
                        {booking.home_collection_charge}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="font-bold text-slate-800">Total Paid</span>
                  <span className="font-bold text-emerald-600 text-xl flex items-center">
                    <IndianRupee size={18} className="mr-0.5" />
                    {booking.total_amount}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
              <Link
                to="/my-lab-bookings"
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-center flex justify-center items-center gap-2 transition-colors"
              >
                View My Bookings
                <ChevronRight size={18} />
              </Link>
              <Link
                to="/dashboard"
                className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-center transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabBookingConfirmationPage;
