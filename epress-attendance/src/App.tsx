import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/AdminDashboard';
import WorkerDashboard from '@/pages/WorkerDashboard';
import Employees from '@/pages/Employees';
import Attendance from '@/pages/Attendance';
import CheckInOut from '@/pages/CheckInOut';
import Departments from '@/pages/Departments';
import LeaveRequests from '@/pages/LeaveRequests';
import Reports from '@/pages/Reports';
import CalendarPage from '@/pages/Calendar';
import NotificationsPage from '@/pages/Notifications';
import Profile from '@/pages/Profile';
import SettingsPage from '@/pages/Settings';
import Shifts from '@/pages/Shifts';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user } = useAuth();

  const Home = user?.role === 'admin' ? AdminDashboard : WorkerDashboard;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/check-in-out" element={<ProtectedRoute><CheckInOut /></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
      <Route path="/leaves" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
      <Route path="/shifts" element={<ProtectedRoute><Shifts /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
