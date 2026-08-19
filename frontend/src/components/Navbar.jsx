import React from 'react';
import { Activity, ShieldCheck, User, LogOut, Calendar, Stethoscope, MessageSquare, FileText, Sparkles } from 'lucide-react';

export default function Navbar({ user, onLogout, onOpenAuth, activeTab, setActiveTab }) {
  const isDoctor = user?.role === 'DOCTOR';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('triage')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-700 bg-clip-text text-transparent font-heading">
                  MedAI
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider">
                  Health OS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">AI Clinical Triage & Telehealth</p>
            </div>
          </div>

          {/* Navigation Links (When authenticated) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('triage')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'triage'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                AI Symptom Triage
              </button>

              <button
                onClick={() => setActiveTab('specialists')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'specialists'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Find Specialists
              </button>

              <button
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'appointments'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                Appointments
              </button>

              {isDoctor && (
                <button
                  onClick={() => setActiveTab('doctor-portal')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'doctor-portal'
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-white/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Physician Portal
                </button>
              )}

              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'prescriptions'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                Prescriptions
              </button>
            </nav>
          )}

          {/* User Status / Login Button */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-100 pl-2 pr-3 py-1.5 rounded-full border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                      {user.name || user.email}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      {isDoctor ? '🩺 Physician' : '👤 Patient'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {user && (
          <div className="md:hidden flex overflow-x-auto py-2 gap-2 border-t border-slate-100 no-scrollbar">
            <button
              onClick={() => setActiveTab('triage')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                activeTab === 'triage' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              AI Triage
            </button>
            <button
              onClick={() => setActiveTab('specialists')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                activeTab === 'specialists' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Doctors
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                activeTab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Appointments
            </button>
            {isDoctor && (
              <button
                onClick={() => setActiveTab('doctor-portal')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  activeTab === 'doctor-portal' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Physician Portal
              </button>
            )}
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                activeTab === 'prescriptions' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Prescriptions
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
