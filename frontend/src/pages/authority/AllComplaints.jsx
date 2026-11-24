import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { getImageUrl } from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Search, X, MapPin, Calendar, User,
  MessageSquare, Image as ImageIcon, ArrowRight
} from 'lucide-react';

const statusColor = {
  'Received': 'status-received',
  'In Progress': 'status-inprogress',
  'Resolved': 'status-resolved',
};

const CATEGORIES = [
  'Roads & Infrastructure',
  'Water Supply',
  'Electricity',
  'Garbage & Sanitation',
  'Street Lights',
  'Parks & Recreation',
  'Public Safety',
  'Drainage',
  'Other',
];

const STATUSES = ['Received', 'In Progress', 'Resolved'];

export default function AllComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', category: '', area: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...filters };
      const { data } = await API.get('/complaints/all', { params });
      setComplaints(data.complaints);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setPage(1);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>All Complaints</h1>
          <p>Review, filter, update statuses, and add official remarks to civic complaints</p>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Showing {complaints.length} of {total} complaints
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search title, description, area..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          {filters.search && (
            <button onClick={() => handleFilterChange('search', '')}>
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          placeholder="Filter by locality/area..."
          value={filters.area}
          onChange={(e) => handleFilterChange('area', e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading complaints...</div>
      ) : (
        <>
          {complaints.length === 0 ? (
            <div className="empty-state">
              <p>No complaints matched your search or filters.</p>
            </div>
          ) : (
            <div className="complaints-grid">
              {complaints.map((c) => {
                const imgUrl = getImageUrl(c.image);

                return (
                  <div key={c._id} className="complaint-card-shape">
                    {/* Media Banner */}
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
                          <ImageIcon size={28} />
                          <span>No photo attached</span>
                        </div>
                      )}

                      {/* Floating Badges */}
                      <div className="card-badge-left">
                        <span
                          className="tag"
                          style={{
                            background: 'rgba(255,255,255,0.95)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                          }}
                        >
                          {c.category}
                        </span>
                      </div>
                      <div className="card-badge-right">
                        <span
                          className={`status-badge ${statusColor[c.status]}`}
                          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-content">
                      <h3 className="card-title" title={c.title}>{c.title}</h3>
                      <p className="card-desc">{c.description}</p>

                      <div className="card-meta-list">
                        <div className="card-meta-item">
                          <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{c.area}</span>
                          <span style={{ color: 'var(--text-muted)' }}>• {c.address}</span>
                        </div>
                        <div className="card-meta-item">
                          <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span>{c.citizen?.name || 'Citizen'}</span>
                          {c.citizen?.phone && <span style={{ color: 'var(--text-muted)' }}>({c.citizen.phone})</span>}
                        </div>
                        <div className="card-meta-item">
                          <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {c.remarks?.length > 0 && (
                          <div className="card-meta-item" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                            <MessageSquare size={14} style={{ flexShrink: 0 }} />
                            <span>{c.remarks.length} Official Remark{c.remarks.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="card-footer">
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        #{c._id.slice(-6).toUpperCase()}
                      </span>
                      <button
                        onClick={() => navigate(`/authority/complaints/${c._id}`)}
                        className="btn btn-primary"
                        style={{ fontSize: '13px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        Manage / Details <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="btn btn-outline"
              >
                ← Prev
              </button>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === pages}
                className="btn btn-outline"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
