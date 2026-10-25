// Straight-line (Haversine) distance between two coordinates, in km.
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// Estimated travel time. Roads are longer than a straight line, so add 30%.
// Assumes about 5 km/h walking and 25 km/h city driving (no live traffic data).
export function travelTimes(km) {
  const roadKm = km * 1.3;
  const fmt = (min) => {
    if (min < 1) return "1 min";
    if (min < 60) return `${Math.round(min)} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m ? `${h} h ${m} min` : `${h} h`;
  };
  return {
    walk: fmt((roadKm / 5) * 60),
    drive: fmt((roadKm / 25) * 60),
  };
}
