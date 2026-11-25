import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Send,
  Building,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Trash2,
  Edit3,
  X,
  Check,
} from 'lucide-react';
import AIVerificationBadge from '../components/AIVerificationBadge';

const statusColor = {
  Received: 'badge-received',
  'In Progress': 'badge-progress',
  Resolved: 'badge-resolved',
};

const statusIcon = {
  Received: <AlertCircle size={15} />,
  'In Progress': <Clock size={15} />,
  Resolved: <CheckCircle size={15} />,
};

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [manualReviewStatus, setManualReviewStatus] = useState('');
  const [manualReviewReason, setManualReviewReason] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', address: '' });
  const [deleting, setDeleting] = useState(false);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/complaints/${id}`);
      setComplaint(res.data);
      setNewStatus(res.data.status);
      setManualReviewStatus(res.data.manualReviewStatus || 'none');
      setManualReviewReason(res.data.manualReviewReason || '');
      setEditForm({
        title: res.data.title,
        description: res.data.description,
        address: res.data.address,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load complaint details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleCitizenSave = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await API.put(`/complaints/${id}`, editForm);
      setComplaint(res.data);
      setIsEditing(false);
      toast.success('Complaint details updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update complaint details');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this complaint? This cannot be undone.')) {
      return;
    }
    try {
      setDeleting(true);
      await API.delete(`/complaints/${id}`);
      toast.success('Complaint deleted successfully');
      navigate(isAuthority ? '/authority/complaints' : '/citizen/my-complaints');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete complaint');
      setDeleting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    try {
      setUpdating(true);
      const payload = {
        status: newStatus,
        remark: newRemark,
      };
      if (manualReviewStatus && manualReviewStatus !== 'none') {
        payload.manualReviewStatus = manualReviewStatus;
        payload.manualReviewReason = manualReviewReason;
      }
      const res = await API.patch(`/complaints/${id}`, payload);
      setComplaint(res.data);
      setNewRemark('');
      toast.success('Complaint and review status updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading complaint details...</p>
      </div>
    );
  }

  if (!complaint) return null;

  const isAuthority = user?.role === 'authority';
  const isOwner = complaint?.citizen?._id === user?._id || complaint?.citizen === user?._id;
  const canEdit = isOwner && complaint?.status !== 'Resolved';
  const canDelete = isOwner || isAuthority;
  const imgUrl = getImageUrl(complaint.image);

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Top Navigation */}
      <div style={{ margin: '20px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={() => navigate(isAuthority ? '/authority/complaints' : '/citizen/my-complaints')}
          className="btn btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Complaints
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Edit3 size={14} /> Edit Complaint
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
              }}
            >
              <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Complaint'}
            </button>
          )}

          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
            ID: #{complaint._id.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)', gap: '24px', alignItems: 'start' }}>
        {/* Main Left Column: Media & Primary Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card Shape Container */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {/* Image Banner */}
            <div style={{ width: '100%', height: '340px', position: 'relative', background: '#0f172a' }}>
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={complaint.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515144/civicvision/matching_complaints/real_pothole_crater.jpg';
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  No photo attached
                </div>
              )}

              {/* Overlaid Badges */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 2 }}>
                <span className="tag" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--primary)', fontWeight: 700, padding: '6px 12px', fontSize: '13px' }}>
                  {complaint.category}
                </span>
              </div>
              <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2 }}>
                <span className={`status-badge ${statusColor[complaint.status]}`} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.25)', fontSize: '13px', padding: '6px 12px' }}>
                  {complaint.status}
                </span>
              </div>
            </div>

            {/* Header Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <AIVerificationBadge status={complaint.verificationStatus} score={complaint.verificationScore} showScore={true} />
                {complaint.manualReviewStatus && complaint.manualReviewStatus !== 'none' && (
                  <span
                    className="tag"
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      background: complaint.manualReviewStatus === 'approved' ? '#dcfce7' : '#fee2e2',
                      color: complaint.manualReviewStatus === 'approved' ? '#166534' : '#991b1b',
                      fontWeight: 700,
                    }}
                  >
                    {complaint.manualReviewStatus === 'approved' ? '✓ Human Authority Approved' : '✗ Human Rejected as False Complaint'}
                  </span>
                )}
              </div>

              {/* Title & Edit Section */}
              {isEditing ? (
                <form onSubmit={handleCitizenSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Title *</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Description *</label>
                    <textarea
                      rows={4}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Landmark / Exact Address *</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="submit"
                      disabled={updating}
                      className="btn btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    >
                      <Check size={14} /> {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn btn-outline"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: 'var(--text)' }}>
                    {complaint.title}
                  </h1>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', paddingBottom: '18px', borderBottom: '1px solid var(--border)', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <strong style={{ color: 'var(--text)' }}>{complaint.area}</strong>, Bengaluru
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={15} style={{ flexShrink: 0 }} />
                      <span>Reported on {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                      Problem Description
                    </h3>
                    <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                      {complaint.description}
                    </p>
                  </div>

                  {/* Specific Street Address */}
                  <div style={{ marginTop: '20px', background: 'var(--bg)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Exact Location / Landmark
                    </strong>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>
                      {complaint.address}
                    </p>
                  </div>
                </>
              )}

              {/* AI Verification Assessment Card */}
              <div style={{
                marginTop: '20px',
                padding: '16px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: complaint.verificationStatus === 'matched' ? '#f0fdf4' :
                            complaint.verificationStatus === 'mismatch_detected' ? '#fef2f2' : '#fffbeb',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} style={{ color: complaint.verificationStatus === 'matched' ? '#15803d' : '#b91c1c' }} />
                    <strong style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text)' }}>
                      AI Image-Category Verification
                    </strong>
                  </div>
                  <AIVerificationBadge status={complaint.verificationStatus} score={complaint.verificationScore} showScore={true} />
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.5 }}>
                  {complaint.verificationReason || 'No AI verification reason recorded.'}
                </p>
                {complaint.manualReviewStatus && complaint.manualReviewStatus !== 'none' && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border)', fontSize: '12.5px' }}>
                    <strong>Administrative Review:</strong> {complaint.manualReviewStatus === 'approved' ? 'Manually Approved' : 'Rejected'} by authority.
                    {complaint.manualReviewReason && <span> Reason: "{complaint.manualReviewReason}"</span>}
                  </div>
                )}
              </div>

              {imgUrl && (
                <div style={{ marginTop: '20px' }}>
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                  >
                    <ExternalLink size={14} /> Open Original High-Res Evidence Photo
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Official Remarks Timeline */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
              Official Action History & Remarks ({complaint.remarks?.length || 0})
            </h3>

            {(!complaint.remarks || complaint.remarks.length === 0) ? (
              <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                No official remarks added yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {complaint.remarks.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px 16px',
                      background: 'var(--bg)',
                      borderLeft: '4px solid var(--primary)',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--text)', lineHeight: 1.5 }}>
                      {r.text}
                    </p>
                    <small style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={12} /> by {r.addedBy?.name || 'Authority'} • {new Date(r.addedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Reporter Info & Authority Action Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Authority Manage Box (If Authority) */}
          {isAuthority && (
            <div className="card" style={{ padding: '24px', border: '2px solid var(--primary)', borderRadius: '12px', background: '#fff' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                <CheckCircle size={18} /> Manage Complaint Status
              </h3>

              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    required
                  >
                    <option value="Received">Received</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                {/* Authority Manual Verification & Integrity Override */}
                <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <ShieldAlert size={15} style={{ color: 'var(--primary)' }} />
                    Human Verification & Audit Override
                  </label>
                  <select
                    value={manualReviewStatus}
                    onChange={(e) => setManualReviewStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', marginBottom: '8px' }}
                  >
                    <option value="none">No Manual Override (Default AI status)</option>
                    <option value="approved">✓ Manually Approve Complaint (Genuine Issue)</option>
                    <option value="rejected">✗ Reject as False / Invalid Complaint</option>
                  </select>

                  <input
                    type="text"
                    value={manualReviewReason}
                    onChange={(e) => setManualReviewReason(e.target.value)}
                    placeholder="Audit reason (e.g. Verified genuine via field inspection / Spam image)..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12.5px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Add Official Remark</label>
                  <textarea
                    rows={4}
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    placeholder="Enter official action details, engineer assignment, or resolution notes for the citizen..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px' }}
                >
                  {updating ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16 }} /> Updating...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Save Status & Add Remark
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Citizen Reporter Information Card */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Reporter Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                  <User size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{complaint.citizen?.name || 'Citizen'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registered Citizen</div>
                </div>
              </div>

              {complaint.citizen?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)' }}>
                  <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                  <span>{complaint.citizen.email}</span>
                </div>
              )}

              {complaint.citizen?.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)' }}>
                  <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                  <span>{complaint.citizen.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Locality Quick Link */}
          <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Need Locality Insights?</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              View all reported civic problems, resolution rate, and map hotspots in {complaint.area}.
            </p>
            <Link
              to={`/area-insights?area=${encodeURIComponent(complaint.area)}`}
              className="btn btn-outline"
              style={{ fontSize: '12.5px', width: '100%', justifyContent: 'center' }}
            >
              Explore {complaint.area} Insights →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
