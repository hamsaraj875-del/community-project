import { useState, useEffect } from 'react';
import API, { getImageUrl } from '../../api/axios';
import { FileText, ChevronDown, ChevronUp, MapPin, Calendar, MessageSquare, ExternalLink, Image as ImageIcon } from 'lucide-react';

const statusColor = {
  'Received': 'status-received',
  'In Progress': 'status-inprogress',
  'Resolved': 'status-resolved',
};

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    API.get('/complaints/my')
      .then((res) => setComplaints(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Complaints</h1>
          <p>Track all your submitted civic issues, status, and uploaded photos</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading your complaints...</div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <p>No complaints submitted yet.</p>
        </div>
      ) : (
        <div className="complaints-grid">
          {complaints.map((c) => {
            const imgUrl = getImageUrl(c.image);
            const isExpanded = expandedId === c._id;

            return (
              <div key={c._id} className="complaint-card-shape">
                {/* Card Media Banner */}
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
                      <span>No photo</span>
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="card-badge-left">
                    <span className="tag" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--primary)', fontWeight: 700 }}>
                      {c.category}
                    </span>
                  </div>
                  <div className="card-badge-right">
                    <span className={`status-badge ${statusColor[c.status]}`} style={{ boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                      {c.status}
                    </span>
                  </div>
                </div>

                {/* Card Main Body */}
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
                      <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {c.remarks?.length > 0 && (
                      <div className="card-meta-item" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                        <MessageSquare size={14} style={{ flexShrink: 0 }} />
                        <span>{c.remarks.length} Authority Remark{c.remarks.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="card-footer">
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ID: #{c._id.slice(-6).toUpperCase()}
                  </span>
                  <button
                    onClick={() => toggleExpand(c._id)}
                    className="btn btn-outline"
                    style={{ fontSize: '13px', padding: '6px 12px' }}
                  >
                    {isExpanded ? (
                      <>Hide <ChevronUp size={15} /></>
                    ) : (
                      <>Details <ChevronDown size={15} /></>
                    )}
                  </button>
                </div>

                {/* Expandable Details Drawer */}
                {isExpanded && (
                  <div className="card-detail-drawer">
                    <div>
                      <strong style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Description</strong>
                      <p style={{ marginTop: '4px', fontSize: '13.5px', color: 'var(--text)' }}>{c.description}</p>
                    </div>

                    <div>
                      <strong style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exact Location</strong>
                      <p style={{ marginTop: '4px', fontSize: '13.5px', color: 'var(--text)' }}>{c.address}, {c.area}</p>
                    </div>

                    {imgUrl && (
                      <div>
                        <strong style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                          Uploaded Problem Photo
                        </strong>
                        <a
                          href={imgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                          style={{ fontSize: '12px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <ExternalLink size={13} /> View Full Photo in Cloudinary
                        </a>
                      </div>
                    )}

                    {c.remarks?.length > 0 && (
                      <div className="remarks" style={{ marginTop: '6px' }}>
                        <strong>Authority Remarks ({c.remarks.length})</strong>
                        {c.remarks.map((r, i) => (
                          <div key={i} className="remark-item">
                            <p>{r.text}</p>
                            <small>{new Date(r.addedAt).toLocaleDateString('en-IN')}</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
