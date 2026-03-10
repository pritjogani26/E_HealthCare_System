import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  Clock,
  Users,
  Activity,
  CheckCircle,
  Smartphone,
  Calendar,
  FileText
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

const HomePage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-emerald-500/30">
      <Header setIsSidebarOpen={setIsSidebarOpen} showSidebarToggle={false} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-slate-900 dark:to-slate-900 pointer-events-none" />
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-1/4 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl opacity-50" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Now Live: Advanced Telemedicine Features
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                Modern Healthcare <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                  Simplified for Everyone
                </span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                Experience the future of medical management. seamless appointments, secure records, and instant doctor connections—all in one premium platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/registration')}
                      className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      Get Started Now
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl font-semibold transition-all hover:scale-105"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Dashboard Preview Image/Mockup */}
            <div className="relative mx-auto mt-16 max-w-5xl">
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200 dark:border-slate-700">
                <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 aspect-video flex items-center justify-center relative group">
                  {/* Decorative Elements replacing actual image for now */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />

                  <div className="grid grid-cols-12 gap-4 p-8 w-full h-full opacity-60 dark:opacity-40 pointer-events-none">
                    <div className="col-span-3 bg-slate-200 dark:bg-slate-800 rounded-lg h-full animate-pulse" />
                    <div className="col-span-9 flex flex-col gap-4">
                      <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                      </div>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase text-sm">Interactive Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: "Active Doctors", value: "500+", icon: Users },
                { label: "Monthly Patients", value: "10k+", icon: Activity },
                { label: "Consultations", value: "25k+", icon: CheckCircle },
                { label: "Satisfaction", value: "99.9%", icon: Heart }
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center text-center group">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    {/* Using a generic icon if specific one fails, but we imported them so it should work */}
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-emerald-600 transition-colors">{stat.value}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Everything You Need</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Our comprehensive suite of tools makes healthcare management improved, secure, and efficient for everyone involved.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Smart Appointments",
                  desc: "Book, reschedule, and manage appointments with ease. Automated reminders reduce no-shows.",
                  icon: Calendar,
                  color: "bg-blue-500"
                },
                {
                  title: "Digital Records",
                  desc: "Securely store and access medical history, prescriptions, and lab reports from anywhere.",
                  icon: FileText,
                  color: "bg-emerald-500"
                },
                {
                  title: "Secure Platform",
                  desc: "Enterprise-grade encryption keeps sensitive patient data safe and compliant with regulations.",
                  icon: Shield,
                  color: "bg-purple-500"
                },
                {
                  title: "Real-time Chat",
                  desc: "Connect instantly with doctors for quick consultations and follow-ups via secure messaging.",
                  icon: Smartphone,
                  color: "bg-orange-500"
                },
                {
                  title: "Lab Integration",
                  desc: "Seamlessly connect with diagnostic labs for faster test results and report generation.",
                  icon: Activity,
                  color: "bg-teal-500"
                },
                {
                  title: "24/7 Support",
                  desc: "Our dedicated support team is always available to assist you with any technical issues.",
                  icon: Clock,
                  color: "bg-pink-500"
                }
              ].map((feature, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50 border border-slate-100 dark:border-slate-800 transition-all duration-300 group">
                  <div className={`w-12 h-12 ${feature.color} bg-opacity-10 dark:bg-opacity-20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-6 h-6 text-slate-800 dark:text-white`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-900" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-teal-900" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />

          <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of patients and doctors who trust E-Health Care for better outcomes and seamless management.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/registration')}
                className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-900 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors shadow-lg shadow-black/20"
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-emerald-400 text-white rounded-xl font-bold text-lg hover:bg-emerald-800/50 transition-colors"
              >
                Secure Login
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// Quick helper for the heart icon in stats
function Heart(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

export default HomePage;
