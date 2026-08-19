import React, { useEffect, useState } from 'react';
import { Stethoscope, Star, Award, Building, Calendar, Search, CheckCircle, Clock } from 'lucide-react';

export default function SpecialistDirectory({ token, onBookWithDoctor, initialFilter = '' }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialFilter);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      if (res.ok && data.doctors) {
        setDoctors(data.doctors);
      }
    } catch (e) {
      console.error('Failed to load doctors:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const term = search.toLowerCase();
    const name = doc.user?.name?.toLowerCase() || '';
    const spec = doc.specialization?.toLowerCase() || '';
    const hosp = doc.hospital?.toLowerCase() || '';
    return name.includes(term) || spec.includes(term) || hosp.includes(term);
  });

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !bookingDate) return;
    setBookingLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const scheduledDateTime = new Date(`${bookingDate}T${bookingTime}:00`);

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          scheduledAt: scheduledDateTime.toISOString(),
          reason: reason || 'General Consultation'
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setSuccessMsg(`Successfully booked appointment with ${selectedDoctor.user?.name || 'Doctor'} on ${bookingDate} at ${bookingTime}!`);
      setTimeout(() => {
        setSelectedDoctor(null);
        setReason('');
        setSuccessMsg('');
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <span>Verified Medical Specialists</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Connect with board-certified physicians, surgeons, and healthcare consultants
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, specialty, or clinic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading specialist network...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No specialists found matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {doc.user?.name ? doc.user.name.split(' ')[1]?.[0] || doc.user.name[0] : 'Dr'}
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-xs font-bold text-amber-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{doc.rating || '4.9'}</span>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 font-heading group-hover:text-blue-600 transition-colors">
                  {doc.user?.name || 'Dr. Medical Specialist'}
                </h3>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">{doc.specialization}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.hospital || 'MedAI University Health'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.experienceYrs || 8}+ Years Experience • License: {doc.licenseNumber}</span>
                  </div>
                </div>

                {doc.bio && (
                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{doc.bio}"
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedDoctor(doc);
                  setErrorMsg('');
                  setSuccessMsg('');
                  // default to tomorrow
                  const tmrw = new Date();
                  tmrw.setDate(tmrw.getDate() + 1);
                  setBookingDate(tmrw.toISOString().split('T')[0]);
                }}
                className="w-full mt-4 py-2.5 px-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-blue-200 hover:border-transparent"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Consultation</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-blue-50/50 via-white to-slate-50">
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Schedule Appointment
              </h3>
              <p className="text-xs text-slate-500">
                Booking with <span className="font-semibold text-blue-600">{selectedDoctor.user?.name}</span> ({selectedDoctor.specialization})
              </p>
            </div>

            <form onSubmit={handleBookSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit / Triage Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Follow-up regarding persistent migraine and light sensitivity..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1 py-2.5 px-3 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {bookingLoading ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
