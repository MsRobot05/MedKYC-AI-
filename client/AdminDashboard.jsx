import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, Stethoscope, Droplet, Siren, Activity, ClipboardList,
  AlertCircle, RefreshCw, Download, Search, Check, Minus, Plus,
} from 'lucide-react';

const NAVY = '#0B2942';
const TEAL = '#0F6E64';
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const card = { backgroundColor: '#FFFFFF', border: '1px solid #EAEBEF', borderRadius: 16, boxShadow: '0 1px 2px rgba(16,24,40,0.04)' };
const th = 'text-left px-5 py-3 font-medium text-xs uppercase tracking-wide';
const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function explain(err) {
  if (!err.response) return "Can't reach the server. Is the backend running on port 5000?";
  if (err.response.status === 403) return "This account isn't an admin. Log in with an admin account.";
  return err.response.data?.message || `Server error (${err.response.status})`;
}

function useAdminData(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(path);
      setData(res.data);
    } catch (err) {
      setError(explain(err));
    }
    setLoading(false);
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { data, setData, error, loading, reload: load };
}

function Muted({ children }) {
  return <p className="text-sm text-gray-400 py-6">{children}</p>;
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="rounded-2xl p-5 text-sm" style={{ backgroundColor: '#FDEEEE', color: '#B3261E', border: '1px solid #F7D4D1' }}>
      <p className="font-medium mb-1">Could not load this section</p>
      <p>{message}</p>
      <button onClick={onRetry} className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: '#FFFFFF', border: '1px solid #F7D4D1' }}>
        Try again
      </button>
    </div>
  );
}

function Badge({ children, bg, fg }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: bg, color: fg }}>
      {children}
    </span>
  );
}

function Note({ text }) {
  if (!text) return null;
  return (
    <div className="rounded-xl px-4 py-2.5 text-sm mb-4" style={{ backgroundColor: '#EEF7F6', color: TEAL, border: '1px solid #D5EDE9' }}>
      {text}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, bg, fg }) {
  return (
    <div className="p-5" style={card}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: bg }}>
        <Icon className="w-5 h-5" style={{ color: fg }} />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-[28px] font-semibold text-gray-900 mt-1 tracking-tight leading-none">{value}</p>
    </div>
  );
}

function WeekBars({ visits, signups }) {
  const max = Math.max(1, ...visits.map((v) => v.count), ...signups.map((s) => s.count));
  const H = 120;
  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height: H + 24 }}>
        {visits.map((v, i) => (
          <div key={v.date} className="flex-1 flex flex-col items-center justify-end">
            <div className="flex items-end gap-1" style={{ height: H }}>
              <div title={`${v.count} visits`} style={{ width: 12, height: Math.max(3, (v.count / max) * H), backgroundColor: TEAL, borderRadius: 4 }} />
              <div title={`${signups[i].count} sign-ups`} style={{ width: 12, height: Math.max(3, (signups[i].count / max) * H), backgroundColor: '#93C5FD', borderRadius: 4 }} />
            </div>
            <span className="text-xs mt-1.5" style={{ color: '#8A8F98' }}>{v.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: TEAL }} />Visits recorded</span>
        <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#93C5FD' }} />New sign-ups</span>
      </div>
    </div>
  );
}

function Donut({ parts }) {
  const sum = parts.reduce((s, p) => s + p.value, 0);
  const total = sum || 1;
  const R = 40;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" width="130" height="130">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#F1F2F4" strokeWidth="14" />
        {parts.map((p) => {
          const len = (p.value / total) * C;
          const el = (
            <circle
              key={p.label}
              cx="50" cy="50" r={R} fill="none" stroke={p.color} strokeWidth="14"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc}
              transform="rotate(-90 50 50)"
            />
          );
          acc += len;
          return el;
        })}
        <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="600" fill="#111827">{sum}</text>
      </svg>
      <div className="space-y-2">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-2 text-sm text-gray-600">
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: p.color }} />
            {p.label} <span className="text-gray-400">({p.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview() {
  const { data, error, loading, reload } = useAdminData('/admin/overview');
  if (loading) return <Muted>Loading overview...</Muted>;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const { counts, visitsDaily, signupsDaily, bloodByGroup, lowStock, recentVisits, recentRequests } = data;
  const maxUnits = Math.max(1, ...bloodByGroup.map((g) => g.units));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Patients" value={counts.patients} icon={Users} bg="#EEF7F6" fg={TEAL} />
        <Kpi label="Doctors" value={counts.doctors} icon={Stethoscope} bg="#F3EEFB" fg="#6B3FA0" />
        <Kpi label="Blood banks" value={counts.bloodBanks} icon={Droplet} bg="#FDEEEE" fg="#B3261E" />
        <Kpi label="Ambulances free" value={`${counts.availableAmbulances}/${counts.ambulances}`} icon={Siren} bg="#FEF6E7" fg="#B7791F" />
        <Kpi label="Visits recorded" value={counts.totalVisits} icon={Activity} bg="#EAF7EE" fg="#1E7A3D" />
        <Kpi label="Pending blood requests" value={counts.pendingRequests} icon={ClipboardList} bg="#F2F3F5" fg="#4A4F57" />
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl p-4 text-sm flex items-start gap-3" style={{ backgroundColor: '#FDEEEE', color: '#B3261E', border: '1px solid #F7D4D1' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Low blood stock across all banks</p>
            <p>{lowStock.join(', ')}. Restock or contact the banks. You can edit units on the Blood stock tab.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 col-span-2" style={card}>
          <h3 className="font-semibold text-[15px] text-gray-900 mb-4">Activity, last 7 days</h3>
          <WeekBars visits={visitsDaily} signups={signupsDaily} />
        </div>
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-[15px] text-gray-900 mb-4">Accounts by role</h3>
          <Donut
            parts={[
              { label: 'Patients', value: counts.patients, color: TEAL },
              { label: 'Doctors', value: counts.doctors, color: '#6B3FA0' },
              { label: 'Admins', value: counts.admins, color: '#B7791F' },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-[15px] text-gray-900 mb-4">Blood inventory (all banks)</h3>
          {bloodByGroup.map((g) => (
            <div key={g.group} className="flex items-center gap-3 mb-2.5">
              <span className="w-9 text-xs font-semibold text-gray-700">{g.group}</span>
              <div className="flex-1 rounded-full" style={{ height: 8, backgroundColor: '#F1F2F4' }}>
                <div style={{ width: `${(g.units / maxUnits) * 100}%`, height: 8, borderRadius: 999, backgroundColor: lowStock.includes(g.group) ? '#D9534F' : TEAL }} />
              </div>
              <span className="w-8 text-xs text-right text-gray-500">{g.units}</span>
            </div>
          ))}
        </div>

        <div className="p-5 col-span-2" style={card}>
          <h3 className="font-semibold text-[15px] text-gray-900 mb-4">Recent activity</h3>
          {recentVisits.length === 0 && recentRequests.length === 0 && <Muted>Nothing has happened yet.</Muted>}
          <div className="space-y-3">
            {recentVisits.map((v) => (
              <div key={v._id} className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F3EEFB' }}>
                  <Stethoscope className="w-4 h-4" style={{ color: '#6B3FA0' }} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">
                    <b>{v.doctor?.name || 'A doctor'}</b> recorded a visit for <b>{v.patient?.name || 'a patient'}</b>
                    {v.diagnosis ? `: ${v.diagnosis}` : ''}
                  </p>
                  <p className="text-xs" style={{ color: '#8A8F98' }}>{fmt(v.createdAt)}</p>
                </div>
              </div>
            ))}
            {recentRequests.map((r) => (
              <div key={r._id} className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FDEEEE' }}>
                  <Droplet className="w-4 h-4" style={{ color: '#B3261E' }} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">
                    <b>{r.patient?.name || 'A patient'}</b> requested <b>{r.bloodGroup}</b> at {r.bloodBank?.name || 'a blood bank'} ({r.status})
                  </p>
                  <p className="text-xs" style={{ color: '#8A8F98' }}>{fmt(r.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Blood stock ---------------- */
function BloodStock() {
  const { data, setData, error, loading, reload } = useAdminData('/admin/bloodbanks');
  const [note, setNote] = useState('');

  const change = async (bank, group, delta) => {
    const current = bank.stock?.[group] || 0;
    const units = Math.max(0, Math.min(999, current + delta));
    if (units === current) return;
    setNote('');
    setData((prev) => prev.map((b) => (b._id === bank._id ? { ...b, stock: { ...b.stock, [group]: units } } : b)));
    try {
      await api.patch(`/admin/bloodbanks/${bank._id}/stock`, { group, units });
    } catch (err) {
      setNote(explain(err));
      reload();
    }
  };

  if (loading) return <Muted>Loading blood banks...</Muted>;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <div>
      <Note text={note} />
      <div className="grid grid-cols-2 gap-4">
        {data.map((bank) => (
          <div key={bank._id} className="p-5" style={card}>
            <h3 className="font-semibold text-[15px] text-gray-900">{bank.name}</h3>
            <p className="text-xs mb-4" style={{ color: '#8A8F98' }}>{bank.address} · {bank.phone}</p>
            <div className="grid grid-cols-4 gap-2">
              {GROUPS.map((g) => {
                const n = bank.stock?.[g] || 0;
                const tone = n === 0 ? { bg: '#FDEEEE', fg: '#B3261E' } : n < 5 ? { bg: '#FEF6E7', fg: '#B7791F' } : { bg: '#EEF7F6', fg: TEAL };
                return (
                  <div key={g} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: tone.bg }}>
                    <div className="text-xs font-semibold" style={{ color: tone.fg }}>{g}</div>
                    <div className="text-lg font-semibold text-gray-900 leading-tight my-1">{n}</div>
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => change(bank, g, -1)} aria-label={`Decrease ${g}`} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <button onClick={() => change(bank, g, 1)} aria-label={`Increase ${g}`} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Fleet ---------------- */
function Fleet() {
  const { data, setData, error, loading, reload } = useAdminData('/admin/ambulances');
  const [note, setNote] = useState('');

  const toggle = async (a) => {
    setNote('');
    try {
      const res = await api.patch(`/admin/ambulances/${a._id}`, { available: !a.available });
      setData((prev) => prev.map((x) => (x._id === a._id ? { ...x, available: res.data.available } : x)));
    } catch (err) {
      setNote(explain(err));
    }
  };

  if (loading) return <Muted>Loading fleet...</Muted>;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <div>
      <Note text={note} />
      <div className="overflow-hidden" style={card}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F2F4', color: '#8A8F98' }}>
              <th className={th}>Driver</th><th className={th}>Vehicle</th><th className={th}>Phone</th><th className={th}>Status</th><th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {data.map((a) => (
              <tr key={a._id} style={{ borderBottom: '1px solid #F7F8FA' }}>
                <td className="px-5 py-3.5 font-medium text-gray-900">{a.driverName}</td>
                <td className="px-5 py-3.5 text-gray-600">{a.vehicleNumber}</td>
                <td className="px-5 py-3.5 text-gray-600">{a.phone}</td>
                <td className="px-5 py-3.5">
                  {a.available ? <Badge bg="#EAF7EE" fg="#1E7A3D">Available</Badge> : <Badge bg="#FEF6E7" fg="#B7791F">On a trip</Badge>}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => toggle(a)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ border: '1px solid #E5E7EB', color: NAVY }}>
                    Mark {a.available ? 'busy' : 'available'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Blood requests ---------------- */
function Requests() {
  const { data, setData, error, loading, reload } = useAdminData('/admin/blood-requests');
  const [note, setNote] = useState('');

  const setStatus = async (r, status) => {
    setNote('');
    try {
      const res = await api.patch(`/admin/blood-requests/${r._id}`, { status });
      setData((prev) => prev.map((x) => (x._id === r._id ? { ...x, status: res.data.status } : x)));
    } catch (err) {
      setNote(explain(err));
    }
  };

  if (loading) return <Muted>Loading requests...</Muted>;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (data.length === 0) return <Muted>No blood requests yet. They appear when patients pre-register one.</Muted>;

  return (
    <div>
      <Note text={note} />
      <div className="overflow-hidden" style={card}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F2F4', color: '#8A8F98' }}>
              <th className={th}>Patient</th><th className={th}>Group</th><th className={th}>Blood bank</th><th className={th}>Requested</th><th className={th}>Status</th><th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r._id} style={{ borderBottom: '1px solid #F7F8FA' }}>
                <td className="px-5 py-3.5 font-medium text-gray-900">{r.patient?.name || 'Unknown'}</td>
                <td className="px-5 py-3.5"><Badge bg="#FDEEEE" fg="#B3261E">{r.bloodGroup}</Badge></td>
                <td className="px-5 py-3.5 text-gray-600">{r.bloodBank?.name || 'Unknown'}</td>
                <td className="px-5 py-3.5 text-xs" style={{ color: '#8A8F98' }}>{fmt(r.createdAt)}</td>
                <td className="px-5 py-3.5">
                  {r.status === 'confirmed' ? <Badge bg="#EAF7EE" fg="#1E7A3D">Confirmed</Badge> : <Badge bg="#FEF6E7" fg="#B7791F">Pending</Badge>}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {r.status === 'pending' ? (
                    <button onClick={() => setStatus(r, 'confirmed')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white inline-flex items-center gap-1" style={{ backgroundColor: NAVY }}>
                      <Check className="w-3 h-3" /> Confirm
                    </button>
                  ) : (
                    <button onClick={() => setStatus(r, 'pending')} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ border: '1px solid #E5E7EB', color: '#4A4F57' }}>
                      Reopen
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Users ---------------- */
function UsersTab() {
  const { user: me } = useAuth();
  const { data, setData, error, loading, reload } = useAdminData('/admin/users');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [note, setNote] = useState('');

  const filtered = useMemo(
    () =>
      (data || []).filter(
        (u) =>
          (role === 'all' || u.role === role) &&
          `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())
      ),
    [data, q, role]
  );

  const changeRole = async (u, newRole) => {
    setNote('');
    try {
      const res = await api.patch(`/admin/users/${u._id}/role`, { role: newRole });
      setData((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: res.data.role } : x)));
      setNote(`${u.name} is now ${newRole}. It takes effect the next time they log in.`);
    } catch (err) {
      setNote(explain(err));
    }
  };

  const exportCsv = () => {
    // Prefix cells that start with = + - @ so spreadsheet apps don't run them as formulas.
    const safe = (v) => {
      const s = String(v);
      return /^[=+\-@]/.test(s) ? `'${s}` : s;
    };
    const rows = [['Name', 'Email', 'Role', 'Joined'], ...filtered.map((u) => [u.name, u.email, u.role, new Date(u.createdAt).toISOString()])];
    const csv = rows.map((r) => r.map((v) => `"${safe(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medkyc-users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Muted>Loading accounts...</Muted>;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const roleStyle = {
    patient: { bg: '#EEF7F6', fg: TEAL },
    doctor: { bg: '#F3EEFB', fg: '#6B3FA0' },
    admin: { bg: '#FEF6E7', fg: '#B7791F' },
  };

  return (
    <div>
      <Note text={note} />
      <div className="overflow-hidden" style={card}>
        <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid #F1F2F4' }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1" style={{ border: '1px solid #E5E7EB', maxWidth: 320 }}>
            <Search className="w-4 h-4 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="text-sm flex-1 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="text-sm rounded-xl px-3 py-2 focus:outline-none" style={{ border: '1px solid #E5E7EB' }}>
              <option value="all">All roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="admin">Admins</option>
            </select>
            <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ border: '1px solid #E5E7EB', color: NAVY }}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Muted>No accounts match.</Muted>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F2F4', color: '#8A8F98' }}>
                <th className={th}>Name</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isMe = String(u._id) === String(me?.id);
                const s = roleStyle[u.role] || roleStyle.patient;
                return (
                  <tr key={u._id} style={{ borderBottom: '1px solid #F7F8FA' }}>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{u.name}{isMe && <span className="text-xs text-gray-400"> (you)</span>}</td>
                    <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className="text-xs font-medium rounded-full px-2.5 py-1 focus:outline-none disabled:opacity-70"
                        style={{ backgroundColor: s.bg, color: s.fg, border: 'none' }}
                      >
                        <option value="patient">patient</option>
                        <option value="doctor">doctor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#8A8F98' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
const TABS = [
  ['overview', 'Overview'],
  ['stock', 'Blood stock'],
  ['fleet', 'Ambulance fleet'],
  ['requests', 'Blood requests'],
  ['users', 'Users'],
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [version, setVersion] = useState(0); // bumping this remounts the tab, which refetches

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Admin Console</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor the platform and manage blood stock, ambulances and accounts</p>
        </div>
        <button onClick={() => setVersion((v) => v + 1)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium" style={{ border: '1px solid #E5E7EB', color: NAVY, backgroundColor: '#FFFFFF' }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="inline-flex gap-1 rounded-xl p-1 mb-6" style={{ backgroundColor: '#F2F3F5' }}>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={tab === key ? { backgroundColor: '#FFFFFF', color: NAVY, boxShadow: '0 1px 2px rgba(16,24,40,0.08)' } : { color: '#8A8F98' }}
          >
            {label}
          </button>
        ))}
      </div>

      <div key={`${tab}-${version}`}>
        {tab === 'overview' && <Overview />}
        {tab === 'stock' && <BloodStock />}
        {tab === 'fleet' && <Fleet />}
        {tab === 'requests' && <Requests />}
        {tab === 'users' && <UsersTab />}
      </div>
    </div>
  );
}