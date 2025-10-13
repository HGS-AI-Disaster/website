// File: src/utils/geoUtils.js
import * as turf from "@turf/turf"

export function getNearestHospitals(userLoc, hospitals, limit = 3) {
  const from = turf.point([userLoc.lng, userLoc.lat])

  return hospitals
    .map((h) => {
      const to = turf.point([h.lng, h.lat])
      const dist = turf.distance(from, to, { units: "kilometers" })
      return { ...h, dist }
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
}

export function isOutsideChiba(point) {
  const minLat = 34.85,
    maxLat = 35.96
  const minLng = 139.69,
    maxLng = 140.87

  return (
    point.lat < minLat ||
    point.lat > maxLat ||
    point.lng < minLng ||
    point.lng > maxLng
  )
}
