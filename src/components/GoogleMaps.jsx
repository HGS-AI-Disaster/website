import {
  GoogleMap,
  Marker,
  Polygon,
  Polyline,
  OverlayView,
} from "@react-google-maps/api"
import CustomZoom from "./CustomZoom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MarkerClusterer } from "@react-google-maps/api"
import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "./ui/button"
import {
  Dot,
  LocateFixed,
  Navigation2,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import polyline from "@mapbox/polyline"
import * as turf from "@turf/turf"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { toast } from "sonner"

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
    polygons.push({
      label: feature.properties?.Label || "default",
      type: feature.geometry.type,
      coordinates: feature.geometry.coordinates,
    })
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
  const [shelters, setShelters] = useState([])
  const mapRef = useRef(null)
  const [waypoints, setWaypoints] = useState([]) // simpan titik2 pilihan user
  const [waypointMarkers, setWaypointMarkers] = useState([])
  const [clusteredMarkers, setClusteredMarkers] = useState([])
  const [dialogIsOpen, setDialogIsOpen] = useState(false)
  const [selectedShelter, setSelectedShelter] = useState()
  const [mapReady, setMapReady] = useState(false)
  const [visibleMarkers, setVisibleMarkers] = useState([])

  const handleIdle = () => {
    setMapReady(true)
  }

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
    lat: 35.20307959805068,
    lng: 140.3732847887497,
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

  // function getNearestExitPoint(userLocation, safePolygons) {
  //   if (!userLocation || !safePolygons.length) return null

  //   // filter zone label = 0
  //   const greenPolys = safePolygons.filter((p) => p.label === "0")
  //   if (!greenPolys.length) return null

  //   const userPoint = turf.point([userLocation.lng, userLocation.lat])

  //   let nearestExit = null
  //   let minDistance = Infinity

  //   greenPolys.forEach((poly) => {
  //     let geom
  //     if (poly.type === "Polygon") {
  //       geom = turf.polygon(poly.coordinates)
  //     } else if (poly.type === "MultiPolygon") {
  //       geom = turf.multiPolygon(poly.coordinates)
  //     }

  //     // iterasi semua koordinat vertex dalam polygon
  //     turf.coordEach(geom, (coord) => {
  //       const candidate = turf.point(coord)
  //       const distance = turf.distance(userPoint, candidate)

  //       if (distance < minDistance) {
  //         minDistance = distance
  //         nearestExit = {
  //           lat: coord[1],
  //           lng: coord[0],
  //         }
  //       }
  //     })
  //   })

  //   return nearestExit
  // }

  // async function getRoute(origin, destination) {
  //   const response = await fetch(
  //     "https://routes.googleapis.com/directions/v2:computeRoutes",
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  //         "X-Goog-FieldMask":
  //           "routes.polyline.encodedPolyline,routes.duration,routes.distanceMeters",
  //       },
  //       body: JSON.stringify({
  //         origin: {
  //           location: {
  //             latLng: { latitude: origin.lat, longitude: origin.lng },
  //           },
  //         },
  //         destination: {
  //           location: {
  //             latLng: { latitude: destination.lat, longitude: destination.lng },
  //           },
  //         },
  //         travelMode: "DRIVE",
  //       }),
  //     }
  //   )

  //   const data = await response.json()
  //   return data.routes?.[0] || null
  // }

  // const handleFindExit = async () => {
  //   const exitPoint = getNearestExitPoint(userLocation, polygons)
  //   if (exitPoint) {
  //     const route = await getRoute(userLocation, exitPoint)
  //     if (route) {
  //       const decodedPath = polyline
  //         .decode(route.polyline.encodedPolyline)
  //         .map(([lat, lng]) => ({
  //           lat,
  //           lng,
  //         }))
  //       setRoutePath(decodedPath)
  //     }
  //   } else {
  //     console.error("Tidak ditemukan rute")
  //   }
  // }

  async function fetchGeoJson(url) {
    try {
      const res = await fetch(url)
      const data = await res.json()

      // kalau file GeoJSON valid biasanya bentuknya FeatureCollection
      if (data.type === "FeatureCollection") {
        return data.features
      } else if (data.type === "Feature") {
        return [data]
      } else {
        console.error("File bukan GeoJSON valid:", data)
        return []
      }
    } catch (err) {
      console.error("Gagal fetch GeoJSON:", err)
      return []
    }
  }

  useEffect(() => {
    console.log(currentLayer)
  }, [currentLayer])

  useEffect(() => {
    if (!mapRef.current || !currentLayer?.file_url) return

    const controller = new AbortController()
    fetchFileUrl(currentLayer.file_url, controller.signal)

    return () => controller.abort()
  }, [currentLayer])

  // useEffect(() => {
  //   if (polygons.length) {
  //     handleFindExit()
  //   }
  // }, [polygons])

  useEffect(() => {
    async function loadProcessedShelters() {
      if (!currentLayer?.processed_url) return

      try {
        const cacheKey = `shelters_${currentLayer.id}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          console.log("👉 Load dari cache")
          console.log(localStorage)
          const parsed = JSON.parse(cached)
          setShelters(parsed) // tetap update state React
          return
        }

        const res = await fetch(currentLayer.processed_url)

        const data = await res.json()

        if (data.type === "FeatureCollection") {
          // console.log(data)
          localStorage.setItem(cacheKey, JSON.stringify(data.features))
          setShelters(data.features) // langsung isi shelter hasil Edge Function
          return
        } else {
          console.error("Processed GeoJSON tidak valid:", data)
          return
        }
      } catch (err) {
        console.error("Gagal fetch processed shelters:", err)
      }
    }

    if (mapReady && currentLayer?.processed_url) {
      toast.promise(loadProcessedShelters(), {
        loading: "Loading processed shelters...",
        success: "Shelters loaded",
        error: "Failed to load shelters",
      })
    }
  }, [mapReady, currentLayer?.processed_url])

  async function planEvacuationRoute(userLoc, shelters, polygons) {
    let currentPoint = userLoc
    const userPoint = turf.point([currentPoint.lng, currentPoint.lat])
    let currentZone = null

    polygons.forEach((poly) => {
      let geom
      if (poly.type === "Polygon") {
        geom = turf.polygon(poly.coordinates)
      } else if (poly.type === "MultiPolygon") {
        geom = turf.multiPolygon(poly.coordinates)
      }

      if (turf.booleanPointInPolygon(userPoint, geom)) {
        currentZone = poly.label
      }
    })

    if (currentZone == null) return []

    let routeSteps = []

    while (currentZone >= 0) {
      const candidates = shelters.filter(
        (h) => h.zoneLabel !== null && h.zoneLabel <= currentZone
      )

      if (!candidates.length) break

      let nearest = null
      let minDist = Infinity
      candidates.forEach((h) => {
        const d = turf.distance(
          turf.point([currentPoint.lng, currentPoint.lat]),
          turf.point([h.geometry.coordinates[0], h.geometry.coordinates[1]])
        )
        if (d < minDist) {
          minDist = d
          nearest = h
        }
      })

      if (!nearest) break

      routeSteps.push({
        lng: nearest.geometry.coordinates[0],
        lat: nearest.geometry.coordinates[1],
      })

      currentPoint = {
        lng: nearest.geometry.coordinates[0],
        lat: nearest.geometry.coordinates[1],
      }
      currentZone = nearest.zoneLabel - 1
    }

    const markers = shelters.filter((f) =>
      routeSteps.some(
        (wp) =>
          wp.lat === f.geometry.coordinates[1] &&
          wp.lng === f.geometry.coordinates[0]
      )
    )

    const clustered = shelters.filter(
      (f) =>
        !routeSteps.some(
          (wp) =>
            wp.lat === f.geometry.coordinates[1] &&
            wp.lng === f.geometry.coordinates[0]
        )
    )

    setWaypoints(routeSteps)
    setWaypointMarkers(markers)
    setClusteredMarkers(clustered)

    return routeSteps
  }

  useEffect(() => {
    planEvacuationRoute(userLocation, shelters, polygons)
  }, [shelters, polygons, currentLayer, mapRef.current])

  useEffect(() => {
    async function getRouteWithWaypoints(origin, waypoints) {
      const body = {
        origin: {
          location: {
            latLng: { latitude: origin.lat, longitude: origin.lng },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: waypoints[waypoints.length - 1].lat,
              longitude: waypoints[waypoints.length - 1].lng,
            },
          },
        },
        intermediates: waypoints.slice(0, -1).map((w) => ({
          location: {
            latLng: { latitude: w.lat, longitude: w.lng },
          },
        })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE_OPTIMAL", // 🚨 tambahin ini biar pake rute jalan beneran
      }

      const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask":
              "routes.polyline.encodedPolyline,routes.legs.steps.polyline.encodedPolyline",
          },
          body: JSON.stringify(body),
        }
      )

      const data = await response.json()
      const output = data.routes?.[0] || null

      if (output) {
        let fullPath = []
        output.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            const stepPath = polyline
              .decode(step.polyline.encodedPolyline)
              .map(([lat, lng]) => ({ lat, lng }))
            fullPath = fullPath.concat(stepPath)
          })
        })
        setRoutePath(fullPath)
      }
    }

    if (waypoints.length) {
      toast.promise(getRouteWithWaypoints(userLocation, waypoints), {
        loading: "Finding evacuation route...",
      })
    }
  }, [waypoints, userLocation])

  return (
    <div className="z-10">
      {loading ? (
        <div>Loading Layer...</div>
      ) : (
        <>
          <Dialog
            open={dialogIsOpen}
            onOpenChange={setDialogIsOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  <div className="w-full flex flex-col justify-center items-center">
                    <img
                      src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/house_279770.png"
                      alt=""
                      srcSet=""
                      className="w-18 mb-8"
                    />
                    <div className="text text-lg mb-2">
                      {selectedShelter?.properties?.name}
                    </div>
                    <div className="text text-[12px] text-gray-600">
                      {selectedShelter?.properties?.address}
                    </div>
                  </div>
                </DialogTitle>
                <div className="flex flex-col w-full items-center mt-4">
                  <div className="text-sm mb-2">Building Type</div>
                  <div className="flex gap-2">
                    {selectedShelter?.properties?.facilityType
                      .split("、")
                      .map((s, i) => {
                        return (
                          <div
                            key={i}
                            className="px-6 py-3 border rounded-md"
                          >
                            {s}
                          </div>
                        )
                      })}
                  </div>
                </div>
                <div className="flex flex-col w-full items-center mt-4">
                  <div className="text-sm mb-2">Capacity</div>
                  <div className="flex gap-2 text-lg font-semibold items-center">
                    <Users
                      size={25}
                      strokeWidth={1.75}
                    />
                    <div className="">
                      {selectedShelter?.properties?.seatingCapacity > 0
                        ? selectedShelter?.properties?.seatingCapacity
                        : "Unknown"}
                    </div>
                  </div>
                </div>
              </DialogHeader>
            </DialogContent>
          </Dialog>
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
            onIdle={handleIdle}
          >
            {mapReady && (
              <>
                {routePath.length > 0 && (
                  <Polyline
                    path={routePath}
                    options={{
                      strokeColor: "#0000FF",
                      strokeOpacity: 0.8,
                      strokeWeight: 5,
                      zIndex: 9999,
                    }}
                  />
                )}

                {polygons.map((poly, i) => {
                  if (poly.type === "Polygon") {
                    return (
                      <Polygon
                        key={i}
                        paths={poly.coordinates[0].map(([lng, lat]) => ({
                          lat,
                          lng,
                        }))}
                        options={{
                          fillColor: getFillColor(poly.label),
                          strokeWeight: 1,
                          strokeColor: "#F0F0F0",
                          fillOpacity: 0.6,
                        }}
                      />
                    )
                  } else if (poly.type === "MultiPolygon") {
                    return poly.coordinates.map((coords, j) => (
                      <Polygon
                        key={`${i}-${j}`}
                        paths={coords[0].map(([lng, lat]) => ({ lat, lng }))}
                        options={{
                          fillColor: getFillColor(poly.label),
                          strokeWeight: 1,
                          strokeColor: "#F0F0F0",
                          fillOpacity: 0.6,
                        }}
                      />
                    ))
                  }
                })}

                {/* 1. Marker khusus yang ada di waypoints */}
                {waypointMarkers.map((f, i) => {
                  const [lng, lat] = f.geometry.coordinates

                  return (
                    <Marker
                      key={`waypoint-${i}`}
                      position={{ lat, lng }}
                      title={f.properties?.name || "Evacuation Shelter"}
                      onClick={() => {
                        setSelectedShelter(f)
                        setDialogIsOpen(true)
                      }}
                    />
                  )
                })}

                {/* 2. Cluster untuk marker lain */}
                <MarkerClusterer
                  options={{
                    styles: [
                      {
                        url:
                          "data:image/svg+xml;charset=UTF-8," +
                          encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <defs>
                <radialGradient id="inner-glow" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stop-color="rgba(37, 99, 235, 0.9)" />
                  <stop offset="100%" stop-color="rgba(37, 99, 235, 0)" />
                </radialGradient>
              </defs>
              <!-- lingkaran glow -->
              // <circle cx="20" cy="20" r="19" fill="url(#inner-glow)" />
            </svg>
          `),
                        height: 40,
                        width: 40,
                        textColor: "#FFFFFF",
                        textSize: 10,
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "300", // light
                      },
                    ],
                    gridSize: 150,
                    minimumClusterSize: 4,
                  }}
                >
                  {(clusterer) =>
                    clusteredMarkers.map((f, i) => {
                      const [lng, lat] = f.geometry.coordinates
                      return (
                        <Marker
                          key={`cluster-${i}`}
                          clusterer={clusterer}
                          position={{ lat, lng }}
                          icon={{
                            url: `https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/clinic_4970758.png`,
                            scaledSize: new window.google.maps.Size(32, 32), // ubah ukuran sesuai kebutuhan
                            // optional: atur anchor biar pas titiknya di tengah bawah
                            anchor: new window.google.maps.Point(16, 32),
                          }}
                          title={
                            `${f.properties?.name} (click to see details)` ||
                            "Evacuation Shelter (click to see details)"
                          }
                          onClick={() => {
                            setSelectedShelter(f)
                            setDialogIsOpen(true)
                          }}
                        />
                      )
                    })
                  }
                </MarkerClusterer>

                {userLocation && (
                  // <Marker
                  //   position={userLocation}
                  //   title="Lokasi Anda Sekarang"
                  //   icon={{
                  //     url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  //   }}
                  //   />

                  <OverlayView
                    position={userLocation}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <HoverCard openDelay={0}>
                      <HoverCardTrigger>
                        <div className="h-4 w-4 border-2 rounded-full bg-red-500 border-white"></div>
                      </HoverCardTrigger>
                      <HoverCardContent
                        className={"w-fit py-1 px-2 text-center"}
                      >
                        You are here
                      </HoverCardContent>
                    </HoverCard>
                  </OverlayView>
                )}

                {searchResult && (
                  <Marker
                    position={searchResult}
                    title="Hasil Pencarian"
                  />
                )}
              </>
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
        </>
      )}
    </div>
  )
}

export default GoogleMaps
