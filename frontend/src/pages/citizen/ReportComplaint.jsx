import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { reverseGeocode } from '../../utils/geocode';
import {
  Upload, X, Image as ImageIcon, Camera, Check,
  Crosshair, MapPin, RefreshCw, AlertCircle
} from 'lucide-react';

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

export default function ReportComplaint() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    area: '',
    address: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Automatically attempt to detect location when page loads
  useEffect(() => {
    handleDetectLocation(true);
  }, []);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleImageInput = (e) => {
    const file = e.target.files[0];
    handleFileChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-Detect GPS Location and reverse-geocode to set Area and Address
  const handleDetectLocation = (isSilent = false) => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser';
      setLocationError(msg);
      if (!isSilent) toast.error(msg);
      return;
    }

    setDetectingLocation(true);
    setLocationError(null);
    let toastId = null;
    if (!isSilent) {
      toastId = toast.loading('Acquiring your GPS location...');
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          if (toastId) toast.loading('Fetching locality & address details...', { id: toastId });

          const result = await reverseGeocode(latitude, longitude);

          if (result && (result.area || result.address)) {
            setForm((prev) => ({
              ...prev,
              area: result.area || 'Current Area',
              address: result.address || `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`,
            }));
            setGpsCoords({ lat: latitude, lon: longitude });
            setLocationError(null);
            if (toastId) {
              toast.success(`Location locked: ${result.area}!`, { id: toastId });
            } else {
              toast.success(`Location auto-detected: ${result.area}!`);
            }
          } else {
            setForm((prev) => ({
              ...prev,
              area: 'Current Area',
              address: `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            }));
            setGpsCoords({ lat: latitude, lon: longitude });
            if (toastId) toast.success('GPS coordinates locked!', { id: toastId });
          }
        } catch {
          const err = 'Failed to resolve address from coordinates';
          setLocationError(err);
          if (toastId) toast.error(err, { id: toastId });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        let errorMsg = 'Failed to get location: ' + error.message;
        if (error.code === 1) {
          errorMsg = 'Location permission was denied. Please allow location access in your browser.';
        } else if (error.code === 2) {
          errorMsg = 'Position unavailable. Please check your device location settings.';
        } else if (error.code === 3) {
          errorMsg = 'Location request timed out. Please try clicking Detect Location again.';
        }
        setLocationError(errorMsg);
        if (toastId) {
          toast.error(errorMsg, { id: toastId });
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.area || !form.address) {
      toast.error('Location is required! Please click "Auto-Detect My Location" to lock the location.');
      return;
    }

    if (!image) {
      toast.error('A photo of the problem is required! Please upload an image.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Uploading photo to Cloudinary and submitting complaint...');

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('image', image);

      await API.post('/complaints', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Complaint submitted with GPS location & photo!', { id: toastId });
      navigate('/citizen/my-complaints');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Report an Issue</h1>
          <p>Describe the civic problem, auto-detect your location, and upload photographic evidence</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Problem Title *</label>
              <input
                type="text"
                placeholder="e.g., Large pothole near bus terminal"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              rows={4}
              placeholder="Describe the issue, hazards, severity, and any helpful context..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          {/* Pure Auto-Detected Location Box (No Manual Input Fields) */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <MapPin size={16} style={{ color: 'var(--primary)' }} />
              <span>Problem Location (Auto-Detected) *</span>
            </label>

            {form.area && form.address ? (
              // Location Locked State
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: 'var(--radius)',
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        background: '#22c55e',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <strong style={{ fontSize: '16px', color: '#15803d' }}>
                      {form.area}
                    </strong>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: '1px solid #86efac',
                      }}
                    >
                      GPS LOCKED
                    </span>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                    {form.address}
                  </p>

                  {gpsCoords && (
                    <small style={{ color: '#64748b', fontSize: '11.5px', display: 'block', marginTop: '4px' }}>
                      Coordinates: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lon.toFixed(5)}
                    </small>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDetectLocation(false)}
                  disabled={detectingLocation}
                  className="btn btn-outline"
                  style={{
                    backgroundColor: '#ffffff',
                    fontSize: '12.5px',
                    padding: '7px 12px',
                    borderColor: '#86efac',
                    color: '#15803d',
                  }}
                  title="Refresh GPS location"
                >
                  <RefreshCw size={13} className={detectingLocation ? 'spin-icon' : ''} />
                  <span>{detectingLocation ? 'Updating...' : 'Re-detect Location'}</span>
                </button>
              </div>
            ) : (
              // Location Not Yet Detected / Prompt State
              <div
                style={{
                  background: '#f8fafc',
                  border: locationError ? '1.5px dashed #f87171' : '1.5px dashed var(--primary)',
                  borderRadius: 'var(--radius)',
                  padding: '24px 20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: locationError ? '#fee2e2' : '#eef2ff', color: locationError ? 'var(--danger)' : 'var(--primary)', marginBottom: '10px' }}>
                  {locationError ? <AlertCircle size={26} /> : <Crosshair size={26} />}
                </div>

                <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>
                  {detectingLocation ? 'Detecting your GPS location...' : locationError ? 'Location Access Needed' : 'Auto-Detect Problem Location'}
                </p>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                  {locationError
                    ? locationError
                    : 'Your location is detected automatically using device GPS and OpenStreetMap reverse geocoding.'}
                </p>

                <button
                  type="button"
                  onClick={() => handleDetectLocation(false)}
                  disabled={detectingLocation}
                  className="btn btn-primary"
                  style={{ padding: '9px 18px', fontSize: '13.5px' }}
                >
                  {detectingLocation ? (
                    <>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#ffffff',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin 0.7s linear infinite',
                        }}
                      />
                      <span>Locating GPS...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair size={16} />
                      <span>Auto-Detect My Location Now</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mandatory Photo Upload Section */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Problem Photo *</span>
              <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                (Mandatory - will be hosted on Cloudinary)
              </span>
            </label>

            {!preview ? (
              <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--primary)',
                  backgroundColor: dragOver ? 'var(--primary-light)' : '#faf5ff',
                  cursor: 'pointer',
                  padding: '36px 20px',
                  textAlign: 'center',
                  borderRadius: 'var(--radius)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '10px' }}>
                  <Camera size={32} />
                  <Upload size={32} />
                </div>
                <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>
                  Click or drag and drop to upload photo
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  PNG, JPG, JPEG, WEBP up to 10MB
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginTop: '14px', pointerEvents: 'none' }}
                >
                  <ImageIcon size={16} /> Choose Photo
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  padding: '16px',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div className="image-preview" style={{ position: 'relative' }}>
                  <img
                    src={preview}
                    alt="Problem Preview"
                    style={{
                      maxHeight: '190px',
                      maxWidth: '260px',
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      display: 'block',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="remove-img"
                    title="Remove Photo"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, marginBottom: '6px' }}>
                    <Check size={18} />
                    <span>Photo attached</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, wordBreak: 'break-all' }}>
                    {image?.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Size: {(image?.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageInput}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Uploading & Submitting...' : 'Submit Complaint with Photo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
