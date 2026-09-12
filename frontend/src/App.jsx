import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import ParkingView from './pages/ParkingView';
import MyHistory from './pages/MyHistory';
import AdminDashboard from './pages/AdminDashboard';
import AdminParkingLog from './pages/AdminParkingLog';
import AdminSlotManagement from './pages/AdminSlotManagement';
import Sidebar from './components/Sidebar';
import { AnimatePresence } from 'framer-motion';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-navy-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-4 xl:p-6 overflow-auto">
        <AnimatePresence mode="wait">
          <Routes>
            {user.role === 'admin' ? (
              <>
                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/logs" element={<ProtectedRoute role="admin"><AdminParkingLog /></ProtectedRoute>} />
                <Route path="/admin/slots" element={<ProtectedRoute role="admin"><AdminSlotManagement /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </>
            ) : (
              <>
                <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
                <Route path="/customer/parking" element={<ProtectedRoute role="customer"><ParkingView /></ProtectedRoute>} />
                <Route path="/customer/history" element={<ProtectedRoute role="customer"><MyHistory /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/customer" replace />} />
              </>
            )}
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
