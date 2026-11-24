import { useState, useEffect, lazy, Suspense } from 'react';
import API, { getImageUrl } from '../api/axios';
import { geocodeArea } from '../utils/geocode';
import { MapPin, TrendingUp, CheckCircle, Clock, AlertCircle, ChevronDown } from 'lucide-react';

// Lazy-load map (Leaflet is heavy)
const ComplaintMap = lazy(() => import('../components/ComplaintMap'));

const statusColor = {
  'Received': 'status-received',
  'In Progress': 'status-inprogress',
  'Resolved': 'status-resolved',
};

export default function AreaInsights() {
  const [areas, setAreas] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [areasLoading, setAreasLoading] = useState(true);
  const [coordsMap, setCoordsMap] = useState({});
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    API.get('/analytics/areas')
      .then(res => setAreas(res.data))
      .catch(console.error)
      .finally(() => setAreasLoading(false));
  }, []);

  const handleSelect = async (area) => {
    setSelected(area);
    if (!area) { setData(null); return; }
    setLoading(true);
    try {
      const { data: d } = await API.get(`/analytics/area/${encodeURIComponent(area)}`);
      setData(d);

      // Geocode area if not cached
      if (!coordsMap[area]) {
        setGeocoding(true);
        const coords = await geocodeArea(area);
        if (coords) setCoordsMap(prev => ({ ...prev, [area]: [coords.lat, coords.lng] }));
        setGeocoding(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const areaCenter = coordsMap[selected] || null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Area Insights</h1>
          <p>Explore complaint data and map hotspots by locality</p>
        </div>
      </div>

      <div className="area-selector">
        <MapPin size={18} />
        <select value={selected} onChange={e => handleSelect(e.target.value)} disabled={areasLoading}>
          <option value="">{areasLoading ? 'Loading areas...' : '-- Select an Area --'}</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <ChevronDown size={16} />
      </div>

      {!selected && !loading && (
        <div className="empty-state">
          <MapPin size={48} />
          <p>Select an area above to view its complaint map and insights</p>
        </div>
      )}

      {loading && <div className="loading">Fetching area data...</div>}

      {data && !loading && (
        <>
          {/* Stats cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <AlertCircle size={24} className="stat-icon blue" />
              <div><span className="stat-num">{data.total}</span><p>Total Reported</p></div>
            </div>
            <div className="stat-card">
              <CheckCircle size={24} className="stat-icon green" />
              <div><span className="stat-num">{data.resolved}</span><p>Resolved</p></div>
            </div>
            <div className="stat-card">
              <Clock size={24} className="stat-icon purple" />
              <div><span className="stat-num">{data.inProgress}</span><p>In Progress</p></div>
            </div>
            <div className="stat-card">
              <AlertCircle size={24} className="stat-icon orange" />
              <div><span className="stat-num">{data.pending}</span><p>Pending</p></div>
            </div>
          </div>

          <div className="area-info-cards">
            <div className="info-card">
              <TrendingUp size={20} />
              <div>
                <h4>Resolution Rate</h4>
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${data.resolutionRate}%` }} />
                </div>
                <strong>{data.resolutionRate}%</strong>
              </div>
            </div>
            <div className="info-card">
              <MapPin size={20} />
              <div>
                <h4>Most Common Issue</h4>
                <strong>{data.mostCommonCategory}</strong>
              </div>
            </div>
          </div>

          {/* Real Map */}
          <div className="section">
            <div className="section-header">
              <h2>Complaint Map — {data.area}</h2>
              {geocoding && <span className="geocoding-badge">📍 Locating on map…</span>}
            </div>
            <div className="map-card">
              <Suspense fallback={<div className="loading">Loading map…</div>}>
                <ComplaintMap
                  mode="area"
                  areaData={data}
                  coordsMap={{ [data.area]: areaCenter }}
                  center={areaCenter}
                  zoom={14}
                />
              </Suspense>
            </div>
            <p className="map-hint">
              🔴 Each dot is a complaint. Colour = status:
              <span style={{ color: '#f59e0b', fontWeight: 600 }}> ● Received </span>
              <span style={{ color: '#6366f1', fontWeight: 600 }}> ● In Progress </span>
              <span style={{ color: '#22c55e', fontWeight: 600 }}> ● Resolved</span>
              . Click a dot for details.
            </p>
          </div>

          {/* Complaints Grid in Card Shapes */}
          <div className="section">
            <div className="section-header">
              <h2>Reported Problems in {data.area}</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{data.complaints.length} problems</span>
            </div>
            {data.complaints.length === 0 ? (
              <div className="empty-state"><p>No complaints found in this area.</p></div>
            ) : (
              <div className="complaints-grid">
                {data.complaints.map(c => {
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
                            <span>{c.address}</span>
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
