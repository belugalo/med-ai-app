import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Chatbot from './components/Chatbot';
import SpecialistDirectory from './components/SpecialistDirectory';
import Appointments from './components/Appointments';
import DoctorPortal from './components/DoctorPortal';
import Prescriptions from './components/Prescriptions';
import {
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Activity,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Zap,
  Users,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [activeTab, setActiveTab] = useState('triage');
  const [specialistFilter, setSpecialistFilter] = useState('');

  // Load user profile when token exists
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then((data) => {
          setUser(data.user);
          if (data.user?.role === 'DOCTOR' && activeTab === 'triage') {
            setActiveTab('doctor-portal');
          }
        })
        .catch(() => {
          handleLogout();
        });
    } else {
      setUser(null);
    }
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    if (newUser?.role === 'DOCTOR') {
      setActiveTab('doctor-portal');
    } else {
      setActiveTab('triage');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setActiveTab('triage');
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleBookWithSpecialist = (specialty) => {
    setSpecialistFilter(specialty);
    setActiveTab('specialists');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user ? (
          /* Authenticated Dashboard Tabs */
          <div className="space-y-6">
            {activeTab === 'triage' && (
              <Chatbot
                token={token}
                user={user}
                onBookAppointmentWithSpecialist={handleBookWithSpecialist}
              />
            )}

            {activeTab === 'specialists' && (
              <SpecialistDirectory
                token={token}
                initialFilter={specialistFilter}
              />
            )}

            {activeTab === 'appointments' && (
              <Appointments
                token={token}
                onBookNew={() => setActiveTab('specialists')}
              />
            )}

            {activeTab === 'doctor-portal' && user?.role === 'DOCTOR' && (
              <DoctorPortal
                token={token}
                user={user}
              />
            )}

            {activeTab === 'prescriptions' && (
              <Prescriptions
                token={token}
                user={user}
              />
            )}
          </div>
        ) : (
          /* Landing / Hero State for Guests */
          <div className="space-y-12 py-4">
            {/* Hero Section */}
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 md:p-14 overflow-hidden shadow-2xl border border-slate-800">
              {/* Background ambient glows */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 max-w-2xl space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Next-Gen Medical Reasoning & Telehealth</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight font-heading">
                  Intelligent Symptom Triage & Verified Care.
                </h1>

                <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                  Evaluate your symptoms in seconds, receive structured risk assessments, connect with board-certified physicians, and manage medical prescriptions with ease.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => handleOpenAuth('login')}
                    className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Try MedAI Demo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenAuth('register')}
                    className="py-3 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl text-sm backdrop-blur-sm transition-all cursor-pointer"
                  >
                    Create Free Account
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-300 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span>Real-time Risk Scoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span>Emergency Safety Filter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span>Board-Certified Specialists</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading mb-1">
                  AI Symptom Triage
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Interactive assistant analyzes multi-symptom patterns, determines urgency levels, and suggests actionable next steps.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading mb-1">
                  Specialist Matching
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automatically pairs your clinical triage results with cardiology, neurology, internal medicine, and family practice specialists.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading mb-1">
                  Emergency Safeguards
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Recognizes high-acuity warning signs immediately and directs patients to emergency departments and 911 dispatch.
                </p>
              </div>
            </div>

            {/* Pre-Seeded Demo Banner */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-teal-50 p-6 rounded-2xl border border-blue-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Instant 1-Click Demo Accounts Ready</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Test the complete patient and doctor workflows instantly with pre-seeded accounts:
                  <span className="font-semibold text-blue-700 ml-1">alice@example.com</span> (Patient) or
                  <span className="font-semibold text-indigo-700 ml-1">drbob@example.com</span> (Physician).
                </p>
              </div>
              <button
                onClick={() => handleOpenAuth('login')}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all whitespace-nowrap cursor-pointer"
              >
                Sign In With 1 Click
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">MedAI Health Systems</span>
            <span>• © 2026 MedAI Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">Clinical Triage & Telehealth Platform</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleLoginSuccess}
        initialMode={authInitialMode}
      />
    </div>
  );
}
