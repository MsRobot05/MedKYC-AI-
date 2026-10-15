import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui';

const ROLE_COLOR = { patient: 'teal', doctor: 'purple', admin: 'amber' };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          <span className="text-sm" style={{ color: '#6B7280' }}>
            Signed in as <span className="font-semibold" style={{ color: '#111827' }}>{user?.name}</span>
          </span>
          <div className="flex items-center gap-4">
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
    </div>
  );
}