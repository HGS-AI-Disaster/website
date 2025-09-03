import { GoogleMap, Marker, Polygon, Polyline } from "@react-google-maps/api"
import CustomZoom from "./CustomZoom"
import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "./ui/button"
import { LocateFixed, Navigation2, ZoomIn, ZoomOut } from "lucide-react"
import polyline from "@mapbox/polyline"
import * as turf from "@turf/turf"

const containerStyle = {
  width: "100%",
  height: "100vh",
  position: "absolute",
  top: "0",
  left: "0",
}

const center = {
  lat: 35.6074,
  lng: 140.1065,
}

function geoJsonToPolygons(geojson) {
  const polygons = []

  const handleFeature = (feature) => {
    const label = feature.properties?.Label || "default"
    const coords = feature.geometry.coordinates

    if (feature.geometry.type === "Polygon") {
      polygons.push({
        label,
        path: coords[0].map(([lng, lat]) => ({ lat, lng })),
      })
    } else if (feature.geometry.type === "MultiPolygon") {
      coords.forEach((poly) => {
        polygons.push({
          label,
          path: poly[0].map(([lng, lat]) => ({ lat, lng })),
        })
      })
    }
  }

  if (geojson.type === "FeatureCollection") {
    geojson.features.forEach(handleFeature)
  } else if (geojson.type === "Feature") {
    handleFeature(geojson)
  }

  return polygons
}

function GoogleMaps({ currentLayer, searchResult }) {
  const [loading, setLoading] = useState(false)
  const [polygons, setPolygons] = useState([])
  const [routePath, setRoutePath] = useState([])
  const mapRef = useRef(null)

  const fetchFileUrl = async (url) => {
    try {
      setLoading(true) // mulai loading
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const polyFeatures = data.features.filter(
            (f) =>
              f.geometry.type === "Polygon" ||
              f.geometry.type === "MultiPolygon"
          )

          const flattened = []
          turf.flattenEach(
            turf.featureCollection(polyFeatures),
            (currentFeature) => {
              flattened.push(currentFeature)
            }
          )

          let dissolved = turf.dissolve(turf.featureCollection(flattened), {
            propertyName: "Label",
          })

          const polygonsData = geoJsonToPolygons(dissolved)
          setPolygons(polygonsData)
        })
        .catch((err) => console.error("Error loading GeoJSON:", err))
    } catch (error) {
      console.error("Error loading GeoJSON:", error)
    }

    setLoading(false)
  }

  const onLoad = useCallback(
    (map) => {
      mapRef.current = map

      // Style polygon berdasarkan Label
      map.data.setStyle((feature) => {
        const label = feature.getProperty("Label")
        let fillColor = "#9e9e9e" // default abu

        switch (label) {
          case "0":
            fillColor = "#4caf50" // hijau
            break
          case "1":
            fillColor = "#ffeb3b" // kuning
            break
          case "2":
            fillColor = "#ff9800" // orange
            break
          case "3":
            fillColor = "#f44336" // merah
            break
          default:
            fillColor = "#9e9e9e"
        }

        return {
          fillColor,
          strokeColor: "#F0F0F0",
          strokeWeight: 0.5,
          fillOpacity: 0.6,
        }
      })

      if (currentLayer?.file_url) {
        fetchFileUrl(currentLayer.file_url)
      }
    },
    [currentLayer]
  )

  const handleZoomIn = () => {
    const map = mapRef.current
    if (map) map.setZoom(map.getZoom() + 1)
  }

  const handleZoomOut = () => {
    const map = mapRef.current
    if (map) map.setZoom(map.getZoom() - 1)
  }

  const [userLocation, setUserLocation] = useState({
    lat: 35.22659978407694,
    lng: 140.3723534530334,
  })

  function getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(pos)
          mapRef.current?.panTo(pos)
          mapRef.current?.setZoom(15)
        },
        (error) => {
          console.error("Gagal mendapatkan lokasi:", error)
          alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.")
        }
      )
    } else {
      alert("Geolocation tidak didukung oleh browser ini.")
    }
  }

  function getFillColor(label) {
    switch (label) {
      case "0":
        return "#4caf50" // hijau
      case "1":
        return "#ffeb3b" // kuning
      case "2":
        return "#ff9800" // orange
      case "3":
        return "#f44336" // merah
      default:
        return "#9e9e9e" // abu
    }
  }

  function getNearestExitPoint(userLocation, safePolygons) {
    if (!userLocation || !safePolygons.length) return null

    // Ambil semua polygon hijau (label "0")
    const greenPolys = safePolygons.filter((p) => p.label === "0")
    if (!greenPolys.length) return null

    const point = turf.point([userLocation.lng, userLocation.lat])
    let nearestExit = null
    let minDistance = Infinity

    greenPolys.forEach((poly) => {
      const line = turf.lineString(
        poly.path.map((coord) => [coord.lng, coord.lat])
      )
      const candidate = turf.nearestPointOnLine(line, point)
      const distance = turf.distance(point, candidate)

      if (distance < minDistance) {
        minDistance = distance
        nearestExit = {
          lat: candidate.geometry.coordinates[1],
          lng: candidate.geometry.coordinates[0],
        }
      }
    })

    return nearestExit
  }

  async function getRoute(origin, destination) {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "routes.polyline.encodedPolyline,routes.duration,routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: { latitude: origin.lat, longitude: origin.lng },
            },
          },
          destination: {
            location: {
              latLng: { latitude: destination.lat, longitude: destination.lng },
            },
          },
          travelMode: "DRIVE",
        }),
      }
    )

    const data = await response.json()
    console.log("Response Routes API:", data)
    return data.routes?.[0] || null
  }

  const handleFindExit = async () => {
    console.log(userLocation, polygons)
    const exitPoint = getNearestExitPoint(userLocation, polygons)
    if (exitPoint) {
      console.log("Titik keluar terdekat:", exitPoint)

      const route = await getRoute(userLocation, exitPoint)
      if (route) {
        const decodedPath = polyline
          .decode(route.polyline.encodedPolyline)
          .map(([lat, lng]) => ({
            lat,
            lng,
          }))
        setRoutePath(decodedPath)
      }
    } else {
      console.error("Tidak ditemukan rute")
    }
  }

  useEffect(() => {
    if (!mapRef.current || !currentLayer?.file_url) return

    fetchFileUrl(currentLayer.file_url)
  }, [currentLayer, mapRef.current])

  useEffect(() => {
    if (polygons.length > 0) {
      handleFindExit()
    }
  }, [polygons])

  // useEffect(() => {
  //   if (searchResult && mapRef.current) {
  //     mapRef.current.panTo(searchResult)
  //     mapRef.current.setZoom(15)
  //     setUserLocation(null)
  //   }
  // }, [searchResult])

  return (
    <div className="z-10">
      {loading ? (
        <div>Loading Layer...</div>
      ) : (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={9}
          options={{
            disableDefaultUI: true,
            gestureHandling: "greedy",
            mapTypeId: "hybrid",
          }}
          onLoad={onLoad}
        >
          {polygons.map((poly, i) => (
            <Polygon
              key={i}
              paths={poly.path}
              options={{
                fillColor: getFillColor(poly.label),
                fillOpacity: 0.6,
                strokeColor: "#F0F0F0",
                strokeWeight: 1,
              }}
            />
          ))}

          {userLocation && (
            <Marker
              position={userLocation}
              title="Lokasi Anda Sekarang"
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />
          )}
          {searchResult && (
            <Marker
              position={searchResult}
              title="Hasil Pencarian"
            />
          )}

          {routePath.length > 0 && (
            <Polyline
              path={routePath}
              options={{
                strokeColor: "#0000FF",
                strokeOpacity: 0.8,
                strokeWeight: 5,
              }}
            />
          )}

          {/* Kontrol zoom & lokasi */}
          <div className="absolute bottom-24 right-8 flex flex-col gap-2 justify-end items-end">
            <Button
              onClick={handleZoomIn}
              className="cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
            >
              <ZoomIn />
            </Button>
            <Button
              onClick={handleZoomOut}
              className="cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
            >
              <ZoomOut />
            </Button>
            <Button
              className="w-min cursor-pointer bg-gray-50 hover:bg-gray-200 text-black"
              onClick={getCurrentLocation}
            >
              <LocateFixed />
            </Button>
            <Button className="cursor-pointer bg-gray-50 hover:bg-gray-200 h-[45px] w-[50px]">
              <Navigation2
                fill="black"
                stroke="black"
                className="size-[25px]"
              />
            </Button>
          </div>
        </GoogleMap>
      )}
    </div>
  )
}

export default GoogleMaps
