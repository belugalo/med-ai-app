import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Stethoscope,
  Calendar,
  Clock,
  PlusCircle,
  ShieldAlert,
  Info,
  RefreshCw,
  Activity
} from 'lucide-react';

const QUICK_PROMPTS = [
  { label: '🌡️ Fever & Sore Throat', text: 'I have a mild fever (100.4°F), sore throat, and a dry cough since yesterday.' },
  { label: '🧠 Migraine & Light Sensitivity', text: 'I have a throbbing headache on the right side of my head and high sensitivity to bright screens and lights.' },
  { label: '🫀 Chest Tightness (Emergency Check)', text: 'I am feeling severe crushing chest pain, tightness, and sudden shortness of breath.' },
  { label: '🤢 Stomach Cramps & Nausea', text: 'I am experiencing sharp abdominal cramps, nausea, and mild bloating after eating.' },
  { label: '🦵 Knee Joint Pain & Stiffness', text: 'My left knee is swollen, stiff in the morning, and hurts when climbing stairs.' },
  { label: '🩹 Itchy Skin Rash', text: 'I noticed an itchy red bumpy rash appearing across my arms and neck.' }
];

export default function Chatbot({ token, user, onBookAppointmentWithSpecialist }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestTriage, setLatestTriage] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch session history on mount
  useEffect(() => {
    if (!token) return;
    loadSessions();
  }, [token]);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0 && !activeSessionId) {
          selectSession(data.sessions[0]);
        } else if (data.sessions.length === 0) {
          createNewSession();
        }
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
    }
  };

  const createNewSession = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'New Health Consultation' })
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSessions(prev => [data.session, ...prev]);
        setActiveSessionId(data.session.id);
        setMessages([
          {
            role: 'bot',
            content: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am MedAI, your clinical health and symptom triage assistant. Please describe the symptoms you are experiencing, their duration, and severity.`
          }
        ]);
        setLatestTriage(null);
      }
    } catch (e) {
      console.error('Failed to create session:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectSession = async (session) => {
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    // Find latest bot message with meta
    const lastBotWithMeta = [...(session.messages || [])].reverse().find(m => m.role === 'bot' && m.meta);
    if (lastBotWithMeta) {
      setLatestTriage(lastBotWithMeta.meta);
    } else {
      setLatestTriage(null);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text || !text.trim() || !activeSessionId || loading) return;

    setInput('');
    const userMsg = { role: 'patient', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`/api/chat/${activeSessionId}/message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: data.content,
            meta: data.structured
          }
        ]);
        if (data.structured) {
          setLatestTriage(data.structured);
        }
        // Refresh session list to reflect title updates
        loadSessions();
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: 'I encountered an issue processing your request. Please try again.'
          }
        ]);
      }
    } catch (e) {
      console.error('Chat error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left / Main: Chat Conversation */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-white to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>AI Clinical Triage Assistant</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-500">Real-time medical reasoning & risk assessment</p>
            </div>
          </div>

          <button
            onClick={createNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200/80 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Consultation</span>
          </button>
        </div>

        {/* Quick Symptom Chips Carousel */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Try asking:</span>
          {QUICK_PROMPTS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.text)}
              disabled={loading}
              className="text-xs font-medium bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-3 py-1 rounded-full whitespace-nowrap transition-all shadow-2xs"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => {
            const isUser = m.role === 'patient';
            const meta = m.meta;

            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 ${
                  isUser
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10 rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-none'
                }`}>
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100">
                      <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                        AI
                      </div>
                      <span className="text-xs font-semibold text-slate-700">MedAI Clinical Evaluator</span>
                    </div>
                  )}

                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>

                  {/* Embedded Triage Card inside Bot Message */}
                  {!isUser && meta && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      {/* Risk Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          meta.risk === 'high'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : meta.risk === 'medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {meta.risk === 'high' ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Risk: {meta.risk?.toUpperCase()}
                        </span>

                        {meta.specialty && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5" />
                            {meta.specialty}
                          </span>
                        )}
                      </div>

                      {/* Quick Follow-up Question Prompts */}
                      {meta.followup_questions && meta.followup_questions.length > 0 && (
                        <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <p className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                            <span>Helpful follow-up responses:</span>
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {meta.followup_questions.map((fq, fidx) => (
                              <button
                                key={fidx}
                                onClick={() => handleSendMessage(`Regarding "${fq}": `)}
                                className="text-left text-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg border border-slate-200 transition-colors"
                              >
                                {fq}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold animate-pulse">
                  AI
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-xs text-slate-500">Evaluating symptoms & clinical guidelines...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what symptoms you feel (e.g. sharp headache for 2 days)..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl shadow-md shadow-blue-500/20 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mt-2">
            <span>🛡️ HIPAA-aligned encrypted consultation</span>
            <span>Educational triage only • Not a final diagnosis</span>
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Clinical Summary & Action Panel */}
      <div className="space-y-4">
        {/* Triage Decision Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-heading">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Clinical Triage Summary</span>
            </h3>
            {latestTriage && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                latestTriage.risk === 'high'
                  ? 'bg-red-100 text-red-800'
                  : latestTriage.risk === 'medium'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {latestTriage.risk} Risk
              </span>
            )}
          </div>

          {latestTriage ? (
            <div className="mt-4 space-y-4">
              {latestTriage.possibleCondition && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Suspected Condition Pattern
                  </label>
                  <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {latestTriage.possibleCondition}
                  </p>
                </div>
              )}

              {latestTriage.suggestions && latestTriage.suggestions.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Recommended Clinical Actions
                  </label>
                  <ul className="space-y-2">
                    {latestTriage.suggestions.map((sug, sidx) => (
                      <li key={sidx} className="flex items-start gap-2 text-xs text-slate-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestTriage.specialty && (
                <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-md shadow-blue-500/20">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-100 mb-1">
                    <Stethoscope className="w-4 h-4 text-teal-300" />
                    <span>Matched Specialist Field</span>
                  </div>
                  <div className="text-base font-bold font-heading">{latestTriage.specialty}</div>
                  <button
                    onClick={() => onBookAppointmentWithSpecialist(latestTriage.specialty)}
                    className="w-full mt-3 py-2 px-3 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-lg text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book with Recommended Doctor</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>Type your symptoms to generate a real-time clinical assessment summary and recommendations.</p>
            </div>
          )}
        </div>

        {/* Consultation History Sidebar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between font-heading">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Prior Consultations</span>
            </span>
            <span className="text-xs text-slate-400">{sessions.length} sessions</span>
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSession(s)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                  activeSessionId === s.id
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                    : 'border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="truncate">{s.title || 'General Consultation'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
