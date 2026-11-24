import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API, { getImageUrl } from '../../api/axios';
import { FileText, Clock, CheckCircle, AlertCircle, Plus, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, LabelList
} from 'recharts';

const statusColor = { 'Received': 'status-received', 'In Progress': 'status-inprogress', 'Resolved': 'status-resolved' };

const AREA_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'
];

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [areaStats, setAreaStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/complaints/my'),
      API.get('/analytics/stats')
    ])
      .then(([myRes, statsRes]) => {
        setComplaints(myRes.data);
        if (statsRes.data?.areaStats) {
          setAreaStats(statsRes.data.areaStats.slice(0, 8));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total = complaints.length;
  const received = complaints.filter(c => c.status === 'Received').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  const areaChartData = areaStats.map(a => ({
    name: a._id.length > 14 ? a._id.slice(0, 14) + '…' : a._id,
    fullName: a._id,
    total: a.total,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome, {user?.name} 👋</h1>
          <p>Track your reported civic issues and view community problem hotspots</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/area-insights" className="btn btn-outline">
            <MapPin size={16} /> Area Insights
          </Link>
          <Link to="/citizen/report" className="btn btn-primary">
            <Plus size={16} /> Report Issue
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><FileText size={24} className="stat-icon blue" /><div><span className="stat-num">{total}</span><p>Your Reported</p></div></div>
        <div className="stat-card"><AlertCircle size={24} className="stat-icon orange" /><div><span className="stat-num">{received}</span><p>Received</p></div></div>
        <div className="stat-card"><Clock size={24} className="stat-icon purple" /><div><span className="stat-num">{inProgress}</span><p>In Progress</p></div></div>
        <div className="stat-card"><CheckCircle size={24} className="stat-icon green" /><div><span className="stat-num">{resolved}</span><p>Resolved</p></div></div>
      </div>

      {/* Majority Complaints by Area Chart */}
      {areaChartData.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div>
              <h2>Areas With Majority Complaints</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Localities reporting the highest number of civic issues across the city
              </p>
            </div>
            <Link to="/area-insights" className="btn btn-outline">View Area Map →</Link>
          </div>
          <div className="chart-card" style={{ height: '320px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={areaChartData}
                margin={{ top: 10, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v, _, { payload }) => [`${v} Complaints`, payload.fullName]}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={26}>
                  <LabelList dataKey="total" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#334155' }} />
                  {areaChartData.map((_, i) => (
                    <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="section">
        <h2>Your Recent Complaints</h2>
        {loading ? <div className="loading">Loading...</div> : complaints.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No complaints yet. <Link to="/citizen/report">Report your first issue</Link></p>
          </div>
        ) : (
          <>
            <div className="complaints-grid">
              {complaints.slice(0, 4).map(c => {
                const imgUrl = getImageUrl(c.image);
                return (
                  <div key={c._id} className="complaint-card-shape">
                    <div className="card-image-wrap">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={c.title}
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515144/civicvision/matching_complaints/real_pothole_crater.jpg';
                          }}
                        />
                      ) : (
                        <div className="card-image-placeholder">
                          <span>No photo</span>
                        </div>
                      )}
                      <div className="card-badge-left">
                        <span className="tag" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--primary)', fontWeight: 700 }}>
                          {c.category}
                        </span>
                      </div>
                      <div className="card-badge-right">
                        <span className={`status-badge ${statusColor[c.status]}`}>
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <div className="card-content">
                      <h3 className="card-title" title={c.title}>{c.title}</h3>
                      <p className="card-desc">{c.description}</p>
                      <div className="card-meta-list">
                        <div className="card-meta-item">
                          <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{c.area}</span>
                        </div>
                        <div className="card-meta-item">
                          <span>📅 {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {complaints.length > 4 && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/citizen/my-complaints" className="btn btn-outline">
                  View all {complaints.length} complaints in card view →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
