import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
          <span className="text-sm font-medium">Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}