import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { getImageUrl } from '../../api/axios';
import { FileText, MapPin, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import AIVerificationBadge from '../../components/AIVerificationBadge';

const statusColor = {
  'Received': 'status-received',
  'In Progress': 'status-inprogress',
  'Resolved': 'status-resolved',
};

export default function MyComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/complaints/my')
      .then((res) => setComplaints(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <AIVerificationBadge status={c.verificationStatus} score={c.verificationScore} showScore={false} />
                    {c.manualReviewStatus && c.manualReviewStatus !== 'none' && (
                      <span
                        className="tag"
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          background: c.manualReviewStatus === 'approved' ? '#dcfce7' : '#fee2e2',
                          color: c.manualReviewStatus === 'approved' ? '#166534' : '#991b1b',
                          fontWeight: 700,
                        }}
                      >
                        {c.manualReviewStatus === 'approved' ? '✓ Authority Confirmed' : '✗ Marked False'}
                      </span>
                    )}
                  </div>

                  <h3 className="card-title" title={c.title}>{c.title}</h3>
                  <p className="card-desc">{c.description}</p>

                  {c.verificationReason && (
                    <div className={`ai-reason-box ${
                      c.verificationStatus === 'matched' ? 'ai-reason-matched' :
                      c.verificationStatus === 'mismatch_detected' ? 'ai-reason-mismatch' : 'ai-reason-review'
                    }`}>
                      <strong>AI Verification:</strong> {c.verificationReason}
                    </div>
                  )}

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
                    onClick={() => navigate(`/citizen/complaints/${c._id}`)}
                    className="btn btn-primary"
                    style={{ fontSize: '13px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    View Details & Edit <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
