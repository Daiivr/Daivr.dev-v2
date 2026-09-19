// Appalachia worldspace bounds from Mappalachia 2.0.5.2 / game 1.7.26.13.
// The menu map covers this entire square, including its illustrated border.
export const GAME_MAP = Object.freeze({
  tiles: "/fallout/map-tiles/{z}/{x}/{y}.webp",
  tileSize: 512,
  tileZoomOffset: 3,
  size: 4096,
  centerX: -500,
  centerY: 135,
  range: 582550,
});

// Leaflet CRS.Simple uses [northing, easting], with Y increasing northward.
export function worldToMap(x, y) {
  const { size, centerX, centerY, range } = GAME_MAP;
  return [(y - centerY + range / 2) * size / range, (x - centerX + range / 2) * size / range];
}
