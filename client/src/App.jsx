import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import BloodBank from './pages/BloodBank';
import Ambulance from './pages/Ambulance';
import KYCForm from './pages/KYCForm';
import DoctorDashboard from './pages/DoctorDashboard';
import History from './pages/History';
import SymptomCheck from './pages/SymptomCheck';
import AdminDashboard from './pages/AdminDashboard';
import AgentChat from './pages/AgentChat';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user?.role) ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kyc" element={<KYCForm />} />
        <Route path="/history" element={<History />} />
        <Route path="/blood-bank" element={<BloodBank />} />
        <Route path="/ambulance" element={<Ambulance />} />
        <Route path="/assistant" element={<AgentChat />} />
        <Route path="/symptom-check" element={<SymptomCheck />} />
        <Route
          path="/doctor"
          element={
            <RoleRoute roles={['doctor', 'admin']}>
              <DoctorDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleRoute roles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}