import { GoogleMap, Marker } from "@react-google-maps/api"
import CustomZoom from "./CustomZoom"
import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "./ui/button"
import { Navigation2 } from "lucide-react"
import * as turf from "@turf/turf"

const containerStyle = {
  width: "100%",
  height: "100vh",
  position: "absolute",
  top: "0",
  left: "0",
}

const center = {
  lat: 34.910608393567081,
  lng: 139.829819886019976,
}

function GoogleMaps({ currentLayer, searchResult }) {
  const mapRef = useRef(null)

  // hanya set mapRef + style di onLoad (jangan fetch di sini)
  const onLoad = useCallback((map) => {
    mapRef.current = map

    map.data.setStyle((feature) => {
      const severity = feature.getProperty("zone")
      let fillColor = "#ffffff"

      switch (severity) {
        case "severe":
          fillColor = "#f44336"
          break
        case "high":
          fillColor = "#ff9800"
          break
        case "moderate":
          fillColor = "#ffeb3b"
          break
        case "low":
          fillColor = "#4caf50"
          break
        default:
          fillColor = "#9e9e9e"
      }

      return {
        fillColor,
        strokeColor: "#ffffff",
        strokeWeight: 1,
        fillOpacity: 0.6,
      }
    })
  }, [])

  const handleZoomIn = () => {
    const map = mapRef.current
    if (map) map.setZoom(map.getZoom() + 1)
  }

  const handleZoomOut = () => {
    const map = mapRef.current
    if (map) map.setZoom(map.getZoom() - 1)
  }

  const [userLocation, setUserLocation] = useState(null)

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

  // helper: pastikan polygon tertutup
  function ensureClosed(feature) {
    if (!feature || !feature.geometry) return feature
    if (feature.geometry.type === "Polygon") {
      const ring = feature.geometry.coordinates[0]
      const first = ring[0]
      const last = ring[ring.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push(first)
        feature.geometry.coordinates = [ring]
      }
    }
    return feature
  }

  useEffect(() => {
    if (!mapRef.current || !currentLayer?.file_url) return

    const map = mapRef.current

    // Clear previous GeoJSON layer
    map.data.forEach((f) => {
      map.data.remove(f)
    })

    if (currentLayer.visibility === "private") return

    fetch(currentLayer.file_url)
      .then((res) => res.json())
      .then((data) => {
        // ambil hanya fitur Polygon / MultiPolygon
        const polyFeatures = (data.features || []).filter(
          (f) =>
            f &&
            f.geometry &&
            (f.geometry.type === "Polygon" ||
              f.geometry.type === "MultiPolygon")
        )

        if (polyFeatures.length === 0) {
          console.warn("No polygons found in GeoJSON")
          return
        }

        // 1) ambil centroid tiap polygon (lebih ringan daripada union)
        const centroids = polyFeatures.map((f) => turf.centroid(f))
        // 2) dedup centroids (sederhana)
        const seen = new Set()
        const uniquePts = []
        centroids.forEach((pt) => {
          const key = pt.geometry.coordinates.join(",")
          if (!seen.has(key)) {
            seen.add(key)
            uniquePts.push(pt)
          }
        })

        const pointCollection = turf.featureCollection(uniquePts)

        // 3) coba concave hull (alpha shape). Tweak maxEdge sesuai kebutuhan
        //    nilai maxEdge dalam kilometer; mulai coba 0.5 - 2.0
        let hull = null
        try {
          hull = turf.concave(pointCollection, { maxEdge: 1 }) // coba 1 km dulu
          console.log("Hull created:", hull)
        } catch (e) {
          console.warn("concave failed:", e)
          hull = null
        }

        // fallback ke convex jika concave gagal
        if (!hull) {
          try {
            hull = turf.convex(pointCollection)
          } catch (e) {
            console.error("convex failed:", e)
            hull = null
          }
        }

        if (!hull) {
          console.error(
            "Failed to create hull (concave & convex both failed). Rendering original polygons instead."
          )

          map.data.addGeoJson(data)
          return
        }

        const closed = ensureClosed(hull)
        const mergedFeatureCollection = turf.featureCollection([closed])

        map.data.addGeoJson(mergedFeatureCollection)
      })
      .catch((err) => {
        console.error("Failed to load GeoJSON:", err)
      })
  }, [currentLayer])

  useEffect(() => {
    if (searchResult && mapRef.current) {
      mapRef.current.panTo(searchResult)
      mapRef.current.setZoom(15)
      setUserLocation(null)
    }
  }, [searchResult])

  return (
    <div className="z-10">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={17}
        options={{
          disableDefaultUI: true,
          gestureHandling: "greedy",
          mapTypeId: "hybrid",
        }}
        onLoad={onLoad}
      >
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
        <div className="absolute bottom-24 right-8 flex flex-col gap-2 justify-end items-end">
          <Button
            onClick={handleZoomIn}
            className="cursor-pointer  bg-white hover:bg-gray-200 text-black font-bold"
          >
            +
          </Button>
          <Button
            onClick={handleZoomOut}
            className=" cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
          >
            -
          </Button>
          <Button
            className="w-min cursor-pointer bg-gray-50 hover:bg-gray-200 text-black"
            onClick={getCurrentLocation}
          >
            🎯
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
    </div>
  )
}

export default GoogleMaps
