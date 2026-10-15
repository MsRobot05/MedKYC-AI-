import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { Bot, Send, Loader2, User, Wrench, Phone } from 'lucide-react';

const NAVY = '#0B2942';

const SUGGESTIONS = [
  'I have chest pain and need help now',
  'Find O+ blood near me for a surgery next week',
  'What does my saved profile say about my allergies?',
];

export default function AgentChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi, I'm your care agent. I can read your saved profile, find blood banks and ambulances near you, and set up a booking for you to confirm. What do you need?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [pending, setPending] = useState([]);
  const [busyIndex, setBusyIndex] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending, loading]);

  const addAssistant = (text) => setMessages((prev) => [...prev, { role: 'assistant', text }]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user', text: content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/agent/chat', { messages: next, location });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply, tools: res.data.trace }]);
      setPending(res.data.pendingActions || []);
    } catch (err) {
      addAssistant(err.response?.data?.reply || 'Could not reach the agent. In an emergency call 108.');
    }
    setLoading(false);
  };

  const confirmAction = async (action, index) => {
    setBusyIndex(index);
    try {
      if (action.type === 'book_ambulance') {
        const res = await api.post('/ambulances/book', { ambulanceId: action.ambulanceId });
        const a = res.data.ambulance;
        addAssistant(`Booked: ${a.vehicleNumber}, driver ${a.driverName}. Their number is ${a.phone}.`);
      } else if (action.type === 'blood_request') {
        await api.post('/bloodbanks/request', {
          bloodBankId: action.bloodBankId,
          bloodGroup: action.bloodGroup,
          neededBy: new Date(),
        });
        addAssistant(`Done. Your ${action.bloodGroup} request is pre-registered.`);
      }
      setPending((p) => p.filter((_, i) => i !== index));
    } catch (err) {
      addAssistant(err.response?.data?.message || 'That action failed. Nothing was booked.');
    }
    setBusyIndex(null);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Care Agent</h1>
      <p className="text-sm text-gray-500 mt-1 mb-5">
        An AI agent that looks things up for you and asks before it does anything.
      </p>

      <a
        href="tel:108"
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium"
        style={{ backgroundColor: '#FDEEEE', color: '#B3261E', border: '1px solid #F7D4D1' }}
      >
        <Phone className="w-4 h-4" /> Emergency? Tap to call 108 now. Don't wait for the AI.
      </a>

      <div
        className="bg-white rounded-2xl flex flex-col"
        style={{ border: '1px solid #EAEBEF', height: 'calc(100vh - 330px)', minHeight: 380 }}
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: m.role === 'user' ? '#F2F3F5' : '#E6F5F3' }}
              >
                {m.role === 'user' ? (
                  <User className="w-4 h-4 text-gray-500" />
                ) : (
                  <Bot className="w-4 h-4" style={{ color: NAVY }} />
                )}
              </div>
              <div style={{ maxWidth: '78%' }}>
                <div
                  className="rounded-2xl px-4 py-2.5 text-sm text-gray-800"
                  style={{ backgroundColor: m.role === 'user' ? '#F2F3F5' : '#F0F9F8', whiteSpace: 'pre-wrap' }}
                >
                  {m.text}
                </div>
                {m.tools?.length > 0 && (
                  <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#8A8F98' }}>
                    <Wrench className="w-3 h-3" /> Used: {[...new Set(m.tools)].join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}

          {pending.map((action, i) => (
            <div
              key={i}
              className="rounded-xl p-4 text-sm"
              style={{ backgroundColor: '#FEF6E7', border: '1px solid #F5E3BC' }}
            >
              <p className="font-medium text-gray-900 mb-0.5">Needs your confirmation</p>
              <p className="text-gray-700 mb-3">{action.label}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmAction(action, i)}
                  disabled={busyIndex === i}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
                  style={{ backgroundColor: NAVY }}
                >
                  {busyIndex === i ? 'Working...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#4A4F57' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E6F5F3' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: NAVY }} />
              </div>
              <p className="text-sm text-gray-400">Working on it...</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4" style={{ borderTop: '1px solid #F1F2F4' }}>
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#EEF7F6', color: '#0F6E64' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask for help..."
              disabled={loading}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none disabled:opacity-60"
              style={{ border: '1px solid #E5E7EB' }}
            />
            <button
              onClick={() => send()}
              disabled={loading}
              className="text-white px-4 rounded-xl disabled:opacity-60"
              style={{ backgroundColor: NAVY }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#8A8F98' }}>
            AI assistant, not a doctor.{' '}
            {location ? 'Using your location for distances.' : 'Location off, so distances are unknown.'}
          </p>
        </div>
      </div>
    </div>
  );
}