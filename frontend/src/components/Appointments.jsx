import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle, XCircle, Stethoscope, Plus } from 'lucide-react';

export default function Appointments({ token, onBookNew }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments/patient', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (e) {
      console.error('Failed to load appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (e) {
      console.error('Failed to cancel appointment:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>My Scheduled Appointments</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage your upcoming clinical visits and teleconsultations
          </p>
        </div>

        <button
          onClick={onBookNew}
          className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Visit</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Scheduled Appointments Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Use the AI triage assistant to assess symptoms or browse our directory of board-certified specialists.
          </p>
          <button
            onClick={onBookNew}
            className="py-2 px-4 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-blue-700 transition-all"
          >
            Find a Specialist & Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => {
            const dateObj = new Date(appt.scheduledAt);
            const isUpcoming = dateObj > new Date() && appt.status !== 'CANCELLED';

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 font-heading">
                          {appt.doctor?.user?.name || 'Doctor Consultation'}
                        </h4>
                        <p className="text-xs text-slate-500">{appt.doctor?.specialization}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      appt.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : appt.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : appt.status === 'CANCELLED'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium">
                        {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-slate-400">•</span>
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium">
                        {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{appt.doctor?.hospital || 'MedAI Health Teleconsult Center'}</span>
                    </div>
                  </div>

                  {appt.reason && (
                    <p className="text-xs text-slate-600 mt-3">
                      <strong className="text-slate-700">Reason:</strong> {appt.reason}
                    </p>
                  )}

                  {appt.notes && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      <strong className="text-slate-700 not-italic">Doctor's Note:</strong> {appt.notes}
                    </p>
                  )}
                </div>

                {isUpcoming && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleCancel(appt.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
