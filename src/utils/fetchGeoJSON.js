export default async function fetchGeoJSON(url) {
  console.log("fetching geojson...")
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch GeoJSON")
  return await res.json()
}
