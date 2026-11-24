/**
 * Geocode and reverse-geocode utilities using Nominatim (OpenStreetMap) — free, no API key.
 */

const cache = {};

export async function geocodeArea(area) {
  if (cache[area]) return cache[area];

  const query = encodeURIComponent(`${area}, Bangalore, India`);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'CivicVision-App/1.0' } }
    );
    const data = await res.json();
    if (data && data[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      cache[area] = coords;
      return coords;
    }
  } catch (e) {
    console.warn('Geocode failed for', area, e.message);
  }
  return null;
}

export async function geocodeAreas(areas) {
  const results = {};
  for (let i = 0; i < areas.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1100));
    const coords = await geocodeArea(areas[i]);
    if (coords) results[areas[i]] = coords;
  }
  return results;
}

/**
 * Reverse-geocode latitude and longitude into an area name and formatted address.
 */
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'CivicVision-App/1.0' } }
    );
    const data = await res.json();
    if (!data || !data.address) return null;

    const addr = data.address;

    // Extract best representative area/locality name
    const area =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.quarter ||
      addr.city_district ||
      addr.subdistrict ||
      addr.town ||
      addr.village ||
      addr.city ||
      '';

    // Build a readable address string
    const street = [addr.house_number, addr.road || addr.pedestrian || addr.footway].filter(Boolean).join(' ');
    const parts = [
      street,
      addr.suburb || addr.neighbourhood,
      addr.city || addr.town || addr.county,
      addr.postcode,
    ].filter(Boolean);

    const formattedAddress = parts.length > 0 ? parts.join(', ') : data.display_name;

    return {
      area: area || (data.name || 'Local Area'),
      address: formattedAddress || data.display_name,
      displayName: data.display_name,
      lat,
      lon,
    };
  } catch (err) {
    console.error('Reverse geocode error:', err);
    return null;
  }
}
