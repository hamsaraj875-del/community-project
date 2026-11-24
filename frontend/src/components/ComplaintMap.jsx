import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getImageUrl } from '../api/axios';

// Fix default marker icon path broken by Vite/Webpack
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLOR = {
  'Received': '#f59e0b',
  'In Progress': '#6366f1',
  'Resolved': '#22c55e',
};

/** Flies map to new center whenever `center` prop changes */
function FlyToCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * Deterministic pseudo-random offset based on complaint ID
 * Ensures markers for the same complaint stay in the exact same spot on rerender
 */
function getOffset(id, index) {
  let hash = 0;
  for (let i = 0; i < (id || '').length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const angle = ((Math.abs(hash) + index * 57) % 360) * (Math.PI / 180);
  const distance = 0.003 + ((Math.abs(hash) % 100) / 100) * 0.008; // ~300m - 1.1km spread
  return [Math.sin(angle) * distance, Math.cos(angle) * distance];
}

/**
 * ComplaintMap:
 *  mode="area"      → Single area map showing individual RED SPOTS for all complaints in that area
 *  mode="authority" → City overview map showing red hotspot circles sized by complaint volume
 */
export default function ComplaintMap({ mode = 'authority', areaData, areaStats, coordsMap, center, zoom = 12 }) {
  const defaultCenter = center || [12.9716, 77.5946]; // Bangalore default

  if (mode === 'area' && areaData) {
    const areaCenter = coordsMap?.[areaData.area] || defaultCenter;

    return (
      <div className="map-wrapper">
        <MapContainer center={areaCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToCenter center={areaCenter} zoom={zoom} />

          {/* Red spots for all complaints occurred in this area */}
          {areaData.complaints.map((c, i) => {
            const [dLat, dLng] = getOffset(c._id, i);
            const pos = [areaCenter[0] + dLat, areaCenter[1] + dLng];

            return (
              <CircleMarker
                key={c._id}
                center={pos}
                radius={9}
                pathOptions={{
                  color: '#b91c1c',         // Deep red border
                  fillColor: '#ef4444',     // Vivid red spot
                  fillOpacity: 0.9,
                  weight: 2.5,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200, padding: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444'
                      }} />
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{c.title}</strong>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                      <div><strong>Category:</strong> {c.category}</div>
                      <div><strong>Address:</strong> {c.address}</div>
                      <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#64748b' }}>
                        "{c.description.length > 80 ? c.description.slice(0, 80) + '…' : c.description}"
                      </div>
                    </div>

                    {c.image && (
                      <div style={{ margin: '6px 0' }}>
                        <a href={getImageUrl(c.image)} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getImageUrl(c.image)}
                            alt="Complaint"
                            style={{ width: '100%', maxHeight: '110px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                          />
                        </a>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{
                        background: STATUS_COLOR[c.status] ? `${STATUS_COLOR[c.status]}20` : '#fef3c7',
                        color: STATUS_COLOR[c.status] || '#d97706',
                        borderRadius: '999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {c.status}
                      </span>
                      <small style={{ color: '#94a3b8' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN')}
                      </small>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="map-legend">
          <span>
            <span className="legend-dot" style={{ background: '#ef4444', border: '1px solid #b91c1c' }} />
            Red Spot = Reported Complaint ({areaData.complaints.length} total)
          </span>
        </div>
      </div>
    );
  }

  // Authority mode — all areas, red bubble size = complaint count
  if (mode === 'authority' && areaStats && coordsMap) {
    const maxCount = Math.max(...areaStats.map(a => a.total), 1);

    return (
      <div className="map-wrapper">
        <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {areaStats.map(a => {
            const coords = coordsMap[a._id];
            if (!coords) return null;
            const radius = 12 + (a.total / maxCount) * 28; // 12px - 40px
            const resolvedPct = a.total ? Math.round((a.resolved / a.total) * 100) : 0;

            return (
              <CircleMarker
                key={a._id}
                center={[coords.lat, coords.lng]}
                radius={radius}
                pathOptions={{
                  color: '#dc2626',
                  fillColor: '#ef4444',
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 190 }}>
                    <strong style={{ fontSize: '14px', color: '#1e293b' }}>{a._id}</strong>
                    <div style={{ marginTop: '6px', fontSize: '13px' }}>
                      <div style={{ color: '#dc2626', fontWeight: 600 }}>🔴 Total Complaints: {a.total}</div>
                      <div style={{ color: '#d97706' }}>🟡 Received: {a.received}</div>
                      <div style={{ color: '#7c3aed' }}>🟣 In Progress: {a.inProgress}</div>
                      <div style={{ color: '#16a34a' }}>🟢 Resolved: {a.resolved}</div>
                      <div style={{ marginTop: '4px', fontWeight: 600 }}>
                        Resolution Rate: {resolvedPct}%
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        <div className="map-legend">
          <span>
            <span className="legend-dot" style={{ background: '#ef4444', opacity: 0.7 }} />
            Red Hotspot (Size represents volume of complaints in area)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="map-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#94a3b8' }}>No map data available</p>
    </div>
  );
}
