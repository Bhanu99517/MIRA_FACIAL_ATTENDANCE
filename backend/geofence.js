// backend/geofence.js

// 1. Set your campus center coordinates here:
const CAMPUS_LAT = 17.123456;   // TODO: replace with your campus latitude
const CAMPUS_LNG = 78.123456;   // TODO: replace with your campus longitude

// 2. Set allowed radius in meters (e.g. 150–300m)
const CAMPUS_RADIUS_METERS = 150;

// Haversine distance in meters between two lat/lng points
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Main helper to check if a point is inside campus
function isInsideCampus(lat, lng) {
  const distance = distanceInMeters(CAMPUS_LAT, CAMPUS_LNG, lat, lng);
  return {
    inRadius: distance <= CAMPUS_RADIUS_METERS,
    distance,
  };
}

module.exports = {
  CAMPUS_LAT,
  CAMPUS_LNG,
  CAMPUS_RADIUS_METERS,
  distanceInMeters,
  isInsideCampus,
};
