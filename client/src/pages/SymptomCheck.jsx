import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { Stethoscope, Send, Loader2, User } from 'lucide-react';

const NAVY = '#0B2942';

export default function SymptomCheck() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi, I'm your AI health assistant. Tell me what symptoms you're experiencing and I'll help figure out what kind of care you might need.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const updated = [...messages, { role: 'user', text: input }];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/symptom/check', { messages: updated });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err) {
      let text;
      if (!err.response) {
        text = "Can't reach the server. Is the backend running on port 5000?";
      } else if (err.response.status === 429) {
        text = err.response.data?.reply || 'Too many requests. Wait a minute and try again.';
      } else {
        text = err.response.data?.reply || err.response.data?.message || `Server error (${err.response.status}).`;
      }
      setMessages((prev) => [...prev, { role: 'assistant', text }]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-1">AI Health Assistant</h1>
      <p className="text-sm text-gray-500 mb-6">Chat about your symptoms, powered by Gemini</p>

      <div
        className="bg-white rounded-2xl flex flex-col"
        style={{ border: '1px solid #EAEBEF', height: 520 }}
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
                  <Stethoscope className="w-4 h-4" style={{ color: NAVY }} />
                )}
              </div>
              <div
                className="rounded-2xl px-4 py-2.5 text-sm text-gray-800"
                style={{
                  maxWidth: '75%',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: m.role === 'user' ? '#F2F3F5' : '#F0F9F8',
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E6F5F3' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: NAVY }} />
              </div>
              <p className="text-sm text-gray-400">Thinking...</p>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4" style={{ borderTop: '1px solid #F1F2F4' }}>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Describe how you're feeling..."
              disabled={loading}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none disabled:opacity-60"
              style={{ border: '1px solid #E5E7EB' }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="text-white px-4 rounded-xl disabled:opacity-60"
              style={{ backgroundColor: NAVY }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#8A8F98' }}>
            AI assistant, not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}