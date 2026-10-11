import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex bg-[#F7F8FA] min-h-screen font-sans">
      <Sidebar />
      <div className="flex-1">
        <div className="flex justify-between items-center px-8 py-4 border-b border-gray-200/70 bg-white sticky top-0 z-10">
          <span className="text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
        <div className="p-8 max-w-6xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}