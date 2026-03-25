import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubscribePage from './pages/SubscribePage';
import DashboardPage from './pages/DashboardPage';
import ScoresPage from './pages/ScoresPage';
import CharitiesPage from './pages/CharitiesPage';
import DrawsPage from './pages/DrawsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDraws from './pages/admin/AdminDraws';
import AdminCharities from './pages/admin/AdminCharities';
import AdminWinners from './pages/admin/AdminWinners';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />;
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />;
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" />;
}

function SubscriberRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />;
  if (!user) return <Navigate to="/login" />;
  if (!['active', 'trialing'].includes(user.subscription?.status)) return <Navigate to="/subscribe" />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/draws" element={<DrawsPage />} />
        <Route path="/subscribe" element={<PrivateRoute><SubscribePage /></PrivateRoute>} />
        <Route path="/dashboard" element={<SubscriberRoute><DashboardPage /></SubscriberRoute>} />
        <Route path="/scores" element={<SubscriberRoute><ScoresPage /></SubscriberRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/draws" element={<AdminRoute><AdminDraws /></AdminRoute>} />
        <Route path="/admin/charities" element={<AdminRoute><AdminCharities /></AdminRoute>} />
        <Route path="/admin/winners" element={<AdminRoute><AdminWinners /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a2a1e', color: '#f0fdf4', border: '1px solid #2d4a35' },
            success: { iconTheme: { primary: '#4ade80', secondary: '#0a0f0d' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
