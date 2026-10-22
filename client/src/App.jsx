import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
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
import Appointments from './pages/Appointments';
import AccessLog from './pages/AccessLog';
import Vitals from './pages/Vitals';
import Emergency from './pages/Emergency';
import EmergencyPublic from './pages/EmergencyPublic';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user?.role) ? children : <Navigate to="/dashboard" replace />;
}

const patientOnly = (el) => <RoleRoute roles={['patient']}>{el}</RoleRoute>;

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/e/:token" element={<EmergencyPublic />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kyc" element={patientOnly(<KYCForm />)} />
        <Route path="/vitals" element={patientOnly(<Vitals />)} />
        <Route path="/emergency" element={patientOnly(<Emergency />)} />
        <Route path="/history" element={<History />} />
        <Route path="/blood-bank" element={<BloodBank />} />
        <Route path="/ambulance" element={<Ambulance />} />
        <Route path="/assistant" element={<AgentChat />} />
        <Route path="/symptom-check" element={<SymptomCheck />} />
        <Route
          path="/appointments"
          element={
            <RoleRoute roles={['patient', 'doctor']}>
              <Appointments />
            </RoleRoute>
          }
        />
        <Route path="/access-log" element={patientOnly(<AccessLog />)} />
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
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}