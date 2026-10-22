import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui';

const ROLE_COLOR = { patient: 'teal', doctor: 'purple', admin: 'amber' };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <Sidebar />
      <div className="flex-1 min-w-0">
        <div
          className="flex justify-between items-center px-8 h-16 sticky top-0 z-10"
          style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EAEBEF' }}
        >
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm"
            style={{ border: '1px solid #E5E7EB', color: '#8A8F98', minWidth: 260 }}
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search or jump to...</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ border: '1px solid #E5E7EB' }}>Ctrl K</span>
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#6B7280' }}>
              <span className="font-semibold" style={{ color: '#111827' }}>{user?.name}</span>
            </span>
            <Badge color={ROLE_COLOR[user?.role] || 'gray'}>{user?.role}</Badge>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: '#0B2942', color: '#5EEAD4' }}
            >
              {(user?.name || '?').trim().charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium hover:opacity-70" style={{ color: '#6B7280' }}>
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
        <div className="p-8" style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Outlet />
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}