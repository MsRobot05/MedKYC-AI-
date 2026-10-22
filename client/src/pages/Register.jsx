import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import AuthShell from '../components/AuthShell';
import { Button, Notice, C } from '../components/ui';

const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500';

function strength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /\d/.test(pw)) s++;
  return s; // 0 to 3
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const score = useMemo(() => strength(form.password), [form.password]);
  const barColor = ['#E5E7EB', '#D9534F', '#E0A030', '#1E7A3D'][score];

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success('Account created. Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.response ? err.response.data?.message || 'Registration failed' : "Can't reach the server. Try again in a minute.");
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes less than a minute"
      footer={<>Already have an account? <Link to="/login" className="font-semibold" style={{ color: C.navy }}>Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice color="red">{error}</Notice>}

        <div>
          <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>I am a</span>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ backgroundColor: '#F2F3F5' }}>
            {[['patient', 'Patient'], ['doctor', 'Doctor']].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => set({ role: v })}
                className="py-2 rounded-lg text-sm font-medium"
                style={form.role === v ? { backgroundColor: '#FFFFFF', color: C.navy, boxShadow: '0 1px 2px rgba(16,24,40,0.08)' } : { color: C.muted }}
              >
                {l}
              </button>
            ))}
          </div>
          {form.role === 'doctor' && (
            <p className="text-xs mt-2" style={{ color: C.muted }}>
              Doctor accounts are not verified in this demo. A real product would check a medical registry.
            </p>
          )}
        </div>

        <label className="block">
          <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Full name</span>
          <input required autoComplete="name" value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} />
        </label>

        <label className="block">
          <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Email</span>
          <input type="email" required autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@example.com" className={inputClass} />
        </label>

        <label className="block">
          <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Password</span>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              placeholder="At least 6 characters"
              className={inputClass}
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute" style={{ right: 12, top: 11 }}>
              {show ? <EyeOff className="w-4 h-4" style={{ color: C.muted }} /> : <Eye className="w-4 h-4" style={{ color: C.muted }} />}
            </button>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: i <= score ? barColor : '#E5E7EB' }} />
            ))}
          </div>
        </label>

        <Button type="submit" loading={loading} className="w-full py-3">Create account</Button>
      </form>
    </AuthShell>
  );
}