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

function mergeByLabel(features, label) {
  // filter hanya Polygon / MultiPolygon
  const sameLabel = features.filter(
    (f) =>
      f.properties.Label === label &&
      (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
  )

  if (sameLabel.length === 0) return null
  if (sameLabel.length === 1) return sameLabel[0]

  let merged = sameLabel[0]
  for (let i = 1; i < sameLabel.length; i++) {
    try {
      merged = turf.union(merged, sameLabel[i])
    } catch (e) {
      console.warn("Union failed, fallback pakai MultiPolygon:", e)
      return turf.multiPolygon(
        sameLabel.map((f) => f.geometry.coordinates),
        { Label: label }
      )
    }
  }

  return merged
}

function GoogleMaps({ currentLayer, searchResult }) {
  const mapRef = useRef(null)

  const onLoad = useCallback((map) => {
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

  useEffect(() => {
    if (!mapRef.current || !currentLayer?.file_url) return

    const map = mapRef.current

    fetch(currentLayer.file_url)
      .then((res) => res.json())
      .then((data) => {
        // hanya ambil Polygon & MultiPolygon
        const polyFeatures = data.features.filter(
          (f) =>
            f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
        )

        // 1. Dissolve dulu berdasarkan "Label"
        const dissolved = turf.dissolve(turf.featureCollection(polyFeatures), {
          propertyName: "Label",
        })

        map.data.addGeoJson(dissolved)
      })
      .catch((err) => console.error("Error loading GeoJSON:", err))
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

        {/* Kontrol zoom & lokasi */}
        <div className="absolute bottom-24 right-8 flex flex-col gap-2 justify-end items-end">
          <Button
            onClick={handleZoomIn}
            className="cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
          >
            +
          </Button>
          <Button
            onClick={handleZoomOut}
            className="cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
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
