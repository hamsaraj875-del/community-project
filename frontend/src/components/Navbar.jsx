import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, MapPin } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <MapPin size={22} />
        <span>CivicVision</span>
      </div>
      <div className="navbar-links">
        {user?.role === 'citizen' && (
          <>
            <Link to="/citizen">Dashboard</Link>
            <Link to="/citizen/report">Report Issue</Link>
            <Link to="/citizen/my-complaints">My Complaints</Link>
            <Link to="/area-insights">Area Insights</Link>
          </>
        )}
        {user?.role === 'authority' && (
          <>
            <Link to="/authority">Dashboard</Link>
            <Link to="/authority/complaints">All Complaints</Link>
            <Link to="/authority/analytics">Analytics</Link>
            <Link to="/area-insights">Area Insights</Link>
          </>
        )}
      </div>
      <div className="navbar-user">
        <User size={16} />
        <span>{user?.name}</span>
        <span className={`role-badge ${user?.role}`}>{user?.role}</span>
        <button onClick={handleLogout} className="logout-btn" title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
