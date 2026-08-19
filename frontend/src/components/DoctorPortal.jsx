import React, { useEffect, useState } from 'react';
import { ShieldCheck, User, Calendar, Clock, CheckCircle, FilePlus, FileText, Phone, Mail, AlertCircle } from 'lucide-react';

export default function DoctorPortal({ token, user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState(null);
  const [medicationsList, setMedicationsList] = useState([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [rxLoading, setRxLoading] = useState(false);
  const [rxSuccess, setRxSuccess] = useState('');

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const fetchDoctorAppointments = async () => {
    try {
      const res = await fetch('/api/appointments/doctor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (e) {
      console.error('Failed to load doctor appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchDoctorAppointments();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const addMedicationRow = () => {
    setMedicationsList(prev => [...prev, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const updateMedicationField = (index, field, value) => {
    setMedicationsList(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleCreatePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientForPrescription) return;
    setRxLoading(true);
    setRxSuccess('');

    try {
      const validMeds = medicationsList.filter(m => m.name.trim() !== '');

      const res = await fetch('/api/doctors/prescriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatientForPrescription.patientId,
          medications: validMeds,
          notes: prescriptionNotes
        })
      });

      if (res.ok) {
        setRxSuccess('Digital prescription issued successfully!');
        setTimeout(() => {
          setSelectedPatientForPrescription(null);
          setMedicationsList([{ name: '', dosage: '', frequency: '', duration: '' }]);
          setPrescriptionNotes('');
          setRxSuccess('');
        }, 2000);
      }
    } catch (e) {
      console.error('Failed to issue prescription:', e);
    } finally {
      setRxLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Physician Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Physician Clinical Dashboard</span>
          </div>
          <h2 className="text-xl font-bold font-heading">{user?.name || 'Dr. Practitioner'}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Review patient triage assessments, consultations, and digital prescriptions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center backdrop-blur-sm border border-white/10">
            <div className="text-xl font-extrabold">{appointments.length}</div>
            <div className="text-[10px] text-blue-200 uppercase font-semibold">Total Patients</div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center backdrop-blur-sm border border-white/10">
            <div className="text-xl font-extrabold text-emerald-400">
              {appointments.filter(a => a.status === 'CONFIRMED').length}
            </div>
            <div className="text-[10px] text-blue-200 uppercase font-semibold">Confirmed</div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Scheduled Patient Consultations</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Real-time schedule</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No scheduled consultations found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((appt) => {
              const dateObj = new Date(appt.scheduledAt);

              return (
                <div key={appt.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-900">
                        {appt.patient?.name || 'Anonymous Patient'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {appt.patient?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {appt.patient.email}
                        </span>
                      )}
                      {appt.patient?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {appt.patient.phone}
                        </span>
                      )}
                    </div>

                    {appt.reason && (
                      <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-700">
                        <strong>Reason / Triage Info:</strong> {appt.reason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPatientForPrescription(appt)}
                      className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>Prescribe Rx</span>
                    </button>

                    {appt.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prescription Modal */}
      {selectedPatientForPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-blue-50/60 via-white to-slate-50">
              <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Issue Digital Prescription</span>
              </h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{selectedPatientForPrescription.patient?.name}</span>
              </p>
            </div>

            <form onSubmit={handleCreatePrescriptionSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {rxSuccess && (
                <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{rxSuccess}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Medications List</label>
                  <button
                    type="button"
                    onClick={addMedicationRow}
                    className="text-xs text-blue-600 font-semibold hover:text-blue-700"
                  >
                    + Add Medication
                  </button>
                </div>

                <div className="space-y-2">
                  {medicationsList.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Medicine name (e.g. Amoxicillin)"
                        value={med.name}
                        onChange={(e) => updateMedicationField(idx, 'name', e.target.value)}
                        className="col-span-2 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={med.dosage}
                        onChange={(e) => updateMedicationField(idx, 'dosage', e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. Twice daily after food)"
                        value={med.frequency}
                        onChange={(e) => updateMedicationField(idx, 'frequency', e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Instructions / Advice</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Drink plenty of fluids, avoid driving if drowsy..."
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatientForPrescription(null)}
                  className="flex-1 py-2.5 px-3 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rxLoading}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {rxLoading ? 'Signing...' : 'Sign & Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
