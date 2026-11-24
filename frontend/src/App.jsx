import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportComplaint from './pages/citizen/ReportComplaint';
import MyComplaints from './pages/citizen/MyComplaints';
import AuthorityDashboard from './pages/authority/AuthorityDashboard';
import AllComplaints from './pages/authority/AllComplaints';
import Analytics from './pages/authority/Analytics';
import AreaInsights from './pages/AreaInsights';
import ComplaintDetails from './pages/ComplaintDetails';

function AppLayout({ children }) {
  const { user } = useAuth();
  return (
    <div className="app-layout">
      {user && <Navbar />}
      <main className="main-content">{children}</main>
    </div>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'authority' ? '/authority' : '/citizen'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Citizen routes */}
            <Route path="/citizen" element={<PrivateRoute role="citizen"><CitizenDashboard /></PrivateRoute>} />
            <Route path="/citizen/report" element={<PrivateRoute role="citizen"><ReportComplaint /></PrivateRoute>} />
            <Route path="/citizen/my-complaints" element={<PrivateRoute role="citizen"><MyComplaints /></PrivateRoute>} />

            {/* Authority routes */}
            <Route path="/authority" element={<PrivateRoute role="authority"><AuthorityDashboard /></PrivateRoute>} />
            <Route path="/authority/complaints" element={<PrivateRoute role="authority"><AllComplaints /></PrivateRoute>} />
            <Route path="/authority/complaints/:id" element={<PrivateRoute role="authority"><ComplaintDetails /></PrivateRoute>} />
            <Route path="/authority/analytics" element={<PrivateRoute role="authority"><Analytics /></PrivateRoute>} />

            {/* Shared */}
            <Route path="/complaints/:id" element={<PrivateRoute><ComplaintDetails /></PrivateRoute>} />
            <Route path="/area-insights" element={<PrivateRoute><AreaInsights /></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
