import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import { Button, Notice, C } from '../components/ui';

const DEMO_PASSWORD = 'demo1234';
const DEMOS = [
  ['Demo patient', 'priya.k@example.com'],
  ['Demo doctor', 'dr.rao@medkyc.com'],
  ['Demo admin', 'admin@medkyc.com'],
];
const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response
          ? err.response.data?.message || 'Login failed'
          : "Can't reach the server. If this is the live site, it may be waking up. Wait a minute and try again."
      );
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your health records"
      footer={<>New here? <Link to="/register" className="font-semibold" style={{ color: C.navy }}>Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice color="red">{error}</Notice>}

        <label className="block">
          <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
        </label>

        <label className="block">
          <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Password</span>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className={inputClass}
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute" style={{ right: 12, top: 11 }}>
              {show ? <EyeOff className="w-4 h-4" style={{ color: C.muted }} /> : <Eye className="w-4 h-4" style={{ color: C.muted }} />}
            </button>
          </div>
        </label>

        <Button type="submit" loading={loading} className="w-full py-3">Sign in</Button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-6 pt-5" style={{ borderTop: '1px solid #EAEBEF' }}>
          <p className="text-xs mb-2" style={{ color: C.muted }}>Local demo shortcuts</p>
          <div className="flex flex-wrap gap-2">
            {DEMOS.map(([label, mail]) => (
              <button
                key={mail}
                type="button"
                onClick={() => { setEmail(mail); setPassword(DEMO_PASSWORD); }}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50"
                style={{ color: C.sub }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}