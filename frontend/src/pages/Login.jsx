import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MapPin, Eye, EyeOff, User, ShieldCheck, Zap } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'authority' ? '/authority' : '/citizen');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const autofillCitizen = () => {
    setForm({
      email: 'rahul@example.com',
      password: 'citizen123',
    });
    toast.success('Autofilled Citizen details!');
  };

  const autofillAuthority = () => {
    setForm({
      email: 'authority@civicvision.com',
      password: 'authority123',
    });
    toast.success('Autofilled Authority details!');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <MapPin size={32} />
          <h1>CivicVision</h1>
          <p>Connecting Citizens to Solutions</p>
        </div>

        <h2>Sign In</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="icon-btn"
                title={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        {/* One-Click Quick Autofill Demo Credentials */}
        <div className="demo-accounts">
          <div className="demo-title">
            <Zap size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: '#f59e0b' }} />
            One-Click Demo Autofill
          </div>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn citizen"
              onClick={autofillCitizen}
              title="Click to autofill default Citizen account"
            >
              <div className="demo-btn-header">
                <User size={15} style={{ color: '#16a34a' }} />
                <span>Citizen Demo</span>
              </div>
              <div className="demo-btn-email">rahul@example.com</div>
            </button>

            <button
              type="button"
              className="demo-btn authority"
              onClick={autofillAuthority}
              title="Click to autofill default Authority account"
            >
              <div className="demo-btn-header">
                <ShieldCheck size={15} style={{ color: '#4f46e5' }} />
                <span>Authority Demo</span>
              </div>
              <div className="demo-btn-email">authority@civicvision.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
