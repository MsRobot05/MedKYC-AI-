import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Users, Stethoscope, Droplet, Siren, Activity, ShieldCheck } from 'lucide-react';

const cardStyles = [
  { bg: '#EEF7F6', fg: '#0F6E64' },
  { bg: '#F3EEFB', fg: '#6B3FA0' },
  { bg: '#FDEEEE', fg: '#B3261E' },
  { bg: '#FEF6E7', fg: '#B7791F' },
  { bg: '#EAF7EE', fg: '#1E7A3D' },
  { bg: '#F2F3F5', fg: '#4A4F57' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data));
    api.get('/admin/users').then((res) => setUsers(res.data));
  }, []);

  if (!stats) {
    return <p className="text-sm text-gray-400">Loading overview...</p>;
  }

  const cards = [
    { label: 'Patients', value: stats.patients, icon: Users },
    { label: 'Doctors', value: stats.doctors, icon: Stethoscope },
    { label: 'Blood Banks', value: stats.bloodBanks, icon: Droplet },
    { label: 'Ambulances', value: stats.ambulances, icon: Siren },
    { label: 'Available Now', value: stats.availableAmbulances, icon: Activity },
    { label: 'Total Visits', value: stats.totalVisits, icon: ShieldCheck },
  ];

  const filteredUsers = filter === 'all' ? users : users.filter((u) => u.role === filter);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">System-wide stats and account management</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map((c, i) => {
          const Icon = c.icon;
          const style = cardStyles[i % cardStyles.length];
          return (
            <div
              key={c.label}
              className="bg-white rounded-2xl p-5"
              style={{ border: '1px solid #EAEBEF', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: style.bg }}
              >
                <Icon className="w-5 h-5" style={{ color: style.fg }} />
              </div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-[28px] font-semibold text-gray-900 mt-1 tracking-tight leading-none">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EAEBEF', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F1F2F4' }}>
          <h3 className="font-semibold text-[15px] text-gray-900">All Accounts</h3>
          <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: '#F2F3F5' }}>
            {['all', 'patient', 'doctor'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium capitalize transition"
                style={
                  filter === f
                    ? { backgroundColor: '#FFFFFF', color: '#0B2942', boxShadow: '0 1px 2px rgba(16,24,40,0.06)' }
                    : { color: '#8A8F98' }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-sm text-gray-400 px-6 py-10 text-center">No accounts found for this filter.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F2F4' }}>
                <th className="text-left px-6 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: '#8A8F98' }}>Name</th>
                <th className="text-left px-6 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: '#8A8F98' }}>Email</th>
                <th className="text-left px-6 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: '#8A8F98' }}>Role</th>
                <th className="text-left px-6 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: '#8A8F98' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #F7F8FA' }}>
                  <td className="px-6 py-3.5 text-gray-900 font-medium">{u.name}</td>
                  <td className="px-6 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={
                        u.role === 'doctor'
                          ? { backgroundColor: '#F3EEFB', color: '#6B3FA0' }
                          : { backgroundColor: '#EEF7F6', color: '#0F6E64' }
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs" style={{ color: '#B0B4BB' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}