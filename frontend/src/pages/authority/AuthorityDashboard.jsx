import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import API, { getImageUrl } from '../../api/axios';
import { geocodeAreas } from '../../utils/geocode';
import { FileText, Users, CheckCircle, Clock, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, LabelList,
} from 'recharts';

const ComplaintMap = lazy(() => import('../../components/ComplaintMap'));

const statusColor = {
  'Received': 'status-received',
  'In Progress': 'status-inprogress',
  'Resolved': 'status-resolved',
};

const AREA_COLORS = [
  '#ef4444','#f97316','#f59e0b','#84cc16',
  '#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899','#06b6d4',
];

export default function AuthorityDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordsMap, setCoordsMap] = useState({});
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/analytics/stats'),
      API.get('/complaints/all?limit=5'),
    ]).then(([s, r]) => {
      setStats(s.data);
      setRecent(r.data.complaints);

      // Geocode all areas for the map
      const areaNames = s.data.areaStats.map(a => a._id);
      setGeocoding(true);
      geocodeAreas(areaNames).then(coords => {
        setCoordsMap(coords);
        setGeocoding(false);
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;

  const topAreas = stats?.areaStats?.slice(0, 10) || [];

  const areaChartData = topAreas.map(a => ({
    name: a._id.length > 14 ? a._id.slice(0, 14) + '…' : a._id,
    fullName: a._id,
    total: a.total,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Authority Dashboard</h1>
          <p>Overview of all civic complaints</p>
        </div>
        <Link to="/authority/analytics" className="btn btn-outline">View Full Analytics →</Link>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <FileText size={24} className="stat-icon blue" />
            <div><span className="stat-num">{stats.total}</span><p>Total Complaints</p></div>
          </div>
          <div className="stat-card">
            <Clock size={24} className="stat-icon orange" />
            <div><span className="stat-num">{stats.received}</span><p>Received</p></div>
          </div>
          <div className="stat-card">
            <Users size={24} className="stat-icon purple" />
            <div><span className="stat-num">{stats.inProgress}</span><p>In Progress</p></div>
          </div>
          <div className="stat-card">
            <CheckCircle size={24} className="stat-icon green" />
            <div><span className="stat-num">{stats.resolved}</span><p>Resolved</p></div>
          </div>
        </div>
      )}

      {/* Area Hotspot section — Map + Bar chart side by side */}
      <div className="section">
        <div className="section-header">
          <h2>Complaint Hotspot Map</h2>
          {geocoding && <span className="geocoding-badge">📍 Locating areas on map…</span>}
        </div>
        <div className="dashboard-map-grid">

          {/* Real Map */}
          <div className="map-card">
            <Suspense fallback={<div className="loading">Loading map…</div>}>
              <ComplaintMap
                mode="authority"
                areaStats={topAreas}
                coordsMap={coordsMap}
                center={[12.9716, 77.5946]}
                zoom={11}
              />
            </Suspense>
            <p className="map-hint">🔴 Larger circle = more complaints. Click a circle for area details.</p>
          </div>

          {/* Area bar chart */}
          <div className="chart-card area-bar-card">
            <h3>Top Areas by Complaint Count</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={areaChartData}
                margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
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
                  formatter={(v, _, { payload }) => [v, payload.fullName]}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  <LabelList dataKey="total" position="right" style={{ fontSize: 12, fontWeight: 600 }} />
                  {areaChartData.map((_, i) => (
                    <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent complaints */}
      <div className="section">
        <div className="section-header">
          <h2>Recent Complaints</h2>
          <Link to="/authority/complaints" className="btn btn-outline">View All →</Link>
        </div>
        <div className="complaints-grid">
          {recent.slice(0, 4).map(c => {
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
                      <span>👤 {c.citizen?.name || 'Citizen'}</span>
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
      </div>
    </div>
  );
}
