import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { Stethoscope, Send, Loader2, User } from 'lucide-react';

export default function SymptomCheck() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi, I'm your AI health assistant. Tell me what symptoms you're experiencing and I'll help figure out what kind of care you might need." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: 'user', text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/symptom/check', { messages: updatedMessages });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Something went wrong reaching the AI assistant — please try again or consult a doctor directly.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-1">AI Health Assistant</h1>
      <p className="text-sm text-gray-500 mb-6">Chat about your symptoms — powered by real AI</p>

      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.role === 'user' ? 'bg-gray-100' : ''
              }`} style={m.role === 'assistant' ? { backgroundColor: '#E6F5F3' } : {}}>
                {m.role === 'user' ? <User className="w-4 h-4 text-gray-500" /> : <Stethoscope className="w-4 h-4" style={{ color: '#0B2942' }} />}
              </div>
              <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[75%] ${
                m.role === 'user' ? 'bg-gray-100 text-gray-900 rounded-tr-sm' : 'text-gray-700 rounded-tl-sm'
              }`} style={m.role === 'assistant' ? { backgroundColor: '#F0F9F8' } : {}}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E6F5F3' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0B2942' }} />
              </div>
              <p className="text-sm text-gray-400">Thinking...</p>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Describe how you're feeling..."
              disabled={loading}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition disabled:opacity-60"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{ backgroundColor: '#0B2942' }}
              className="text-white px-4 rounded-xl transition disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">This is an AI assistant, not a substitute for professional medical advice.</p>
        </div>
      </div>
    </div>
  );
}