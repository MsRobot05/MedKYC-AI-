import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Users, Stethoscope, Droplet, Siren, Activity, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data));
    api.get('/admin/users').then((res) => setUsers(res.data));
  }, []);

  const cards = stats ? [
    { label: 'Patients', value: stats.patients, icon: Users, color: 'text-teal-700 bg-teal-50' },
    { label: 'Doctors', value: stats.doctors, icon: Stethoscope, color: 'text-purple-700 bg-purple-50' },
    { label: 'Blood Banks', value: stats.bloodBanks, icon: Droplet, color: 'text-rose-700 bg-rose-50' },
    { label: 'Ambulances', value: stats.ambulances, icon: Siren, color: 'text-amber-700 bg-amber-50' },
    { label: 'Available Now', value: stats.availableAmbulances, icon: Activity, color: 'text-green-700 bg-green-50' },
    { label: 'Total Visits', value: stats.totalVisits, icon: ShieldCheck, color: 'text-gray-700 bg-gray-100' },
  ] : [];

  const filteredUsers = filter === 'all' ? users : users.filter((u) => u.role === filter);

  if (!stats) {
    return <p className="text-sm text-gray-400">Loading overview...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Admin Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">System-wide stats and account management</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-0.5 tracking-tight">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-900">All Accounts</h3>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['all', 'patient', 'doctor'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-sm text-gray-400 px-6 py-8 text-center">No accounts found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-6 py-3 font-medium uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 font-medium uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 font-medium uppercase tracking-wide">Role</th>
                <th className="px-6 py-3 font-medium uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                  <td className="px-6 py-3.5 text-gray-900 font-medium">{u.name}</td>
                  <td className="px-6 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.role === 'doctor' ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-gray-400 text-xs">
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