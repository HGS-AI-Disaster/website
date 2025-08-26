import { GoogleMap, HeatmapLayer, Marker } from "@react-google-maps/api"
import CustomZoom from "./CustomZoom"
import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "./ui/button"
import { Navigation2 } from "lucide-react"

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
} // Kota Chiba

function GoogleMaps({ currentLayer, searchResult }) {
  const mapRef = useRef(null)
  const [heatmapData, setHeatmapData] = useState([])

  const onLoad = useCallback((map) => {
    mapRef.current = map

    map.data.setStyle((feature) => {
      const severity = feature.getProperty("zone")
      let fillColor = "#ffffff"

      switch (severity) {
        case "severe":
          fillColor = "#f44336" // merah
          break
        case "high":
          fillColor = "#ff9800" // oranye
          break
        case "moderate":
          fillColor = "#ffeb3b" // kuning
          break
        case "low":
          fillColor = "#4caf50" // hijau
          break
        default:
          fillColor = "#9e9e9e" // abu-abu
      }

      return {
        fillColor: fillColor,
        strokeColor: "#ffffff",
        strokeWeight: 1,
        fillOpacity: 0.6,
      }
    })

    const geojsonUrl = currentLayer?.file_url

    setHeatmapData([])
    // Load new GeoJSON layer
    fetch(geojsonUrl)
      .then((res) => res.json())
      .then((geojson) => {
        if (!geojson.features) return
        const points = geojson.features
          .filter((f) => f.geometry.type === "Point")
          .map(
            (f) =>
              new window.google.maps.LatLng(
                f.geometry.coordinates[1], // lat
                f.geometry.coordinates[0] // lng
              )
          )

        setHeatmapData(points)
      })
      .catch((err) => {
        console.error("Failed to load GeoJSON:", err)
      })
  }, [])

  const handleZoomIn = () => {
    const map = mapRef.current
    if (map) {
      map.setZoom(map.getZoom() + 1)
    }
  }

  const handleZoomOut = () => {
    const map = mapRef.current
    if (map) {
      map.setZoom(map.getZoom() - 1)
    }
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
    if (!mapRef.current || !currentLayer.file_url) return

    setHeatmapData([])

    const map = mapRef.current

    // Clear previous GeoJSON layer
    map.data.forEach((feature) => {
      map.data.remove(feature)
    })

    if (currentLayer.visibility === "private") {
      return
    }

    // Load new GeoJSON layer
    fetch(currentLayer?.file_url)
      .then((res) => res.json())
      .then((geojson) => {
        if (!geojson.features) return
        const points = geojson.features
          .filter((f) => f.geometry.type === "Point")
          .map(
            (f) =>
              new window.google.maps.LatLng(
                f.geometry.coordinates[1], // lat
                f.geometry.coordinates[0] // lng
              )
          )

        setHeatmapData(points)
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
        zoom={12}
        options={{
          disableDefaultUI: true,
          gestureHandling: "greedy",
          mapTypeId: "hybrid",
        }}
        onLoad={onLoad}
      >
        {/* Heatmap */}
        {heatmapData.length > 0 && (
          <HeatmapLayer
            data={heatmapData}
            options={{
              radius: 40, // makin besar makin melebar
              opacity: 0.7, // transparansi
            }}
          />
        )}
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
            // onClick={zoomIn}
            onClick={handleZoomIn}
            className="cursor-pointer  bg-white hover:bg-gray-200 text-black font-bold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-zoom-in"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"
              />
              <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z" />
              <path
                fill-rule="evenodd"
                d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"
              />
            </svg>
          </Button>
          <Button
            onClick={handleZoomOut}
            className=" cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-zoom-out"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"
              />
              <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z" />
              <path
                fill-rule="evenodd"
                d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"
              />
            </svg>
          </Button>
          <Button
            className={
              "w-min cursor-pointer bg-gray-50 hover:bg-gray-200 text-black"
            }
            onClick={() => {
              getCurrentLocation((pos) => {
                mapRef.current?.panTo(pos)
                mapRef.current?.setZoom(15)
              })
            }}
            // disabled={locating}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-record-circle"
              viewBox="0 0 16 16"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
              <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
            </svg>
          </Button>
          <Button
            className={
              "cursor-pointer bg-gray-50 hover:bg-gray-200 h-[45px] w-[50px]"
            }
          >
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
