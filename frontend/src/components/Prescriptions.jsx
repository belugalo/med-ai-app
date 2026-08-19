import React, { useEffect, useState } from 'react';
import { FileText, Stethoscope, Calendar, Pill, AlertCircle, Download, CheckCircle2 } from 'lucide-react';

export default function Prescriptions({ token, user }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/doctors/prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.prescriptions) {
        setPrescriptions(data.prescriptions);
      }
    } catch (e) {
      console.error('Failed to load prescriptions:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <span>Electronic Prescriptions & Records</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Access verified digital prescriptions and medication directions from attending physicians
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading prescription records...</div>
      ) : prescriptions.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Prescriptions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Prescriptions issued by your consulting physician after appointments will appear here securely.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((rx) => {
            const rxDate = new Date(rx.createdAt);
            const meds = Array.isArray(rx.medications) ? rx.medications : [];

            return (
              <div
                key={rx.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {rx.doctor?.user?.name || 'Attending Physician'}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{rxDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      Verified Rx
                    </span>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Prescribed Medications
                    </label>

                    <div className="space-y-2">
                      {meds.map((m, midx) => (
                        <div key={midx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{m.name || 'Prescription Medication'}</span>
                            {m.dosage && <span className="text-xs text-blue-600 font-semibold">{m.dosage}</span>}
                          </div>
                          {m.frequency && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              <strong>Frequency:</strong> {m.frequency}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {rx.notes && (
                      <div className="mt-3 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-amber-900">
                        <strong className="block mb-0.5 font-bold">Physician Notes:</strong>
                        <span>{rx.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Rx ID: #{rx.id}</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valid & Signed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
