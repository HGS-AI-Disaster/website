import {
  GoogleMap,
  Marker,
  Polygon,
  Polyline,
  OverlayView,
} from "@react-google-maps/api"
import Supercluster from "supercluster"
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
  TriangleAlert,
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
import { useSelector } from "react-redux"

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
  const { data: layersData, status } = useSelector((state) => state.layers)

  const [loading, setLoading] = useState(false)
  const [polygons, setPolygons] = useState([])
  const [routePath, setRoutePath] = useState([])
  const [shelters, setShelters] = useState([])
  const mapRef = useRef(null)
  const [waypoints, setWaypoints] = useState([]) // simpan titik2 pilihan user
  const [waypointMarkers, setWaypointMarkers] = useState([])
  const [dialogIsOpen, setDialogIsOpen] = useState(false)
  const [selectedShelter, setSelectedShelter] = useState()
  const [mapReady, setMapReady] = useState(false)
  const [clusters, setClusters] = useState([])
  const [supercluster, setSupercluster] = useState(null)
  const [disasterPoint, setDisasterPoint] = useState({})
  const [userLocation, setUserLocation] = useState({})
  const [mapCenter, setMapCenter] = useState(center) // default center
  // const [userLocation, setUserLocation] = useState({
  //   lat: 35.20307959805068,
  //   lng: 140.3732847887497,
  // })

  function isOutsideChiba(point) {
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

  function getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          setUserLocation(pos)

          if (isOutsideChiba(pos)) {
            // kalau di luar Chiba → center & starting point di disasterPoint
            if (disasterPoint.lat) {
              setMapCenter(disasterPoint)
              mapRef.current?.panTo(disasterPoint)
              toast.info("You’re currently outside Chiba.", {
                description:
                  "We don’t have data for your location yet. The evacuation routes shown are from the disaster point to the safest point, not from your current location.",
                // duration: Infinity,
                id: "outside-chiba",
                duration: Number.POSITIVE_INFINITY,
              })
            }
          } else {
            setMapCenter(pos)
            mapRef.current?.panTo(pos)
          }
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
    getCurrentLocation()
  }, [disasterPoint])

  useEffect(() => {
    if (
      !layersData ||
      layersData.length === 0 ||
      layersData.find((l) => l.visibility === "public") === undefined
    ) {
      console.log("layersData is empty, clearing map elements.")
      setPolygons([])
      setRoutePath([])
      setClusters([])
      setWaypoints([])
      setWaypointMarkers([])
      setSupercluster(null)
      setShelters([])
    }
  }, [layersData])

  const handleIdle = () => {
    setMapReady(true)
    if (supercluster && mapRef.current) {
      const map = mapRef.current
      const bounds = map.getBounds()
      if (!bounds) return

      const zoom = map.getZoom()
      const bbox = [
        bounds.getSouthWest().lng(),
        bounds.getSouthWest().lat(),
        bounds.getNorthEast().lng(),
        bounds.getNorthEast().lat(),
      ]

      const clusters = supercluster.getClusters(bbox, zoom)
      setClusters(clusters)
    }
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

          const disasterCenter = {
            lat: polyFeatures[0].properties.Latitude,
            lng: polyFeatures[0].properties.Longitude,
          }

          setDisasterPoint(disasterCenter)

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

      if (currentLayer?.file_url) {
        fetchFileUrl(currentLayer.file_url)
      }

      getCurrentLocation()
    },
    [currentLayer]
  )

  const getUserLoc = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          const isSameLocation = (a, b) => a.lat === b.lat && a.lng === b.lng

          if (!isSameLocation(userLocation, pos)) {
            setUserLocation(pos)
          }

          mapRef.current?.panTo(pos)

          if (isOutsideChiba(pos)) {
            toast.info("You’re currently outside Chiba.", {
              description: "We don’t have data for your location yet.",
              // duration: Infinity,
              id: "outside-chiba",
              duration: Number.POSITIVE_INFINITY,
            })
          }
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

  const handleZoomIn = () => {
    const map = mapRef.current
    if (map) map.setZoom(map.getZoom() + 1)
  }

  const handleZoomOut = () => {
    const map = mapRef.current
    if (map) map.setZoom(map.getZoom() - 1)
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

  useEffect(() => {
    if (!mapRef.current || !currentLayer?.file_url) return

    const controller = new AbortController()
    fetchFileUrl(currentLayer.file_url, controller.signal)

    return () => controller.abort()
  }, [currentLayer])

  useEffect(() => {
    async function loadProcessedShelters() {
      if (!currentLayer?.processed_url) return

      try {
        const res = await fetch(currentLayer.processed_url)

        const data = await res.json()

        if (data.type === "FeatureCollection") {
          // localStorage.setItem(cacheKey, JSON.stringify(data.features))
          setShelters(data.features)
          return
        } else {
          console.error("Processed GeoJSON is not valid:", data)
          return
        }
      } catch (err) {
        console.error("Failed to fetch processed shelters:", err)
      }
    }

    if (mapReady && currentLayer?.processed_url) {
      loadProcessedShelters()
    }
  }, [mapReady, currentLayer?.processed_url])

  async function planEvacuationRoute(userLoc, shelters, polygons) {
    const startPoint =
      isOutsideChiba(userLoc) && disasterPoint.lat ? disasterPoint : userLoc

    let currentPoint = startPoint
    const startingPoint = turf.point([currentPoint.lng, currentPoint.lat])
    let currentZone = null

    polygons.forEach((poly) => {
      let geom
      if (poly.type === "Polygon") {
        geom = turf.polygon(poly.coordinates)
      } else if (poly.type === "MultiPolygon") {
        geom = turf.multiPolygon(poly.coordinates)
      }

      if (turf.booleanPointInPolygon(startingPoint, geom)) {
        currentZone = poly.label
      }
    })

    if (currentZone == null) return []

    let routeSteps = []

    while (currentZone >= 0) {
      const candidates = shelters.filter(
        (h) =>
          h.properties.zoneLabel !== null &&
          h.properties.zoneLabel <= currentZone
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
      currentZone = nearest.properties.zoneLabel - 1
    }

    const markers = shelters.filter((f) =>
      routeSteps.some(
        (wp) =>
          wp.lat === f.geometry.coordinates[1] &&
          wp.lng === f.geometry.coordinates[0]
      )
    )

    setWaypoints(routeSteps)
    setWaypointMarkers(markers)

    return routeSteps
  }

  useEffect(() => {
    // kalau salah satu kosong langsung reset
    if (!userLocation.lat || !shelters.length || !polygons.length) {
      setRoutePath([])
      setWaypoints([])
      setWaypointMarkers([])
      return
    }

    const start =
      isOutsideChiba(userLocation) && disasterPoint.lat
        ? disasterPoint
        : userLocation

    // kalau ada semua baru plan
    planEvacuationRoute(start, shelters, polygons)
  }, [shelters, polygons, currentLayer, userLocation, disasterPoint])

  useEffect(() => {
    let active = true // flag aktif
    const controller = new AbortController()

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
        routingPreference: "TRAFFIC_AWARE_OPTIMAL",
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

      if (!active) return

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

    if (!waypoints.length) {
      setRoutePath([]) // Logika ini yang seharusnya menghapus polyline
      return
    }

    const origin = isOutsideChiba(userLocation) ? disasterPoint : userLocation

    getRouteWithWaypoints(origin, waypoints)

    return () => {
      active = false // hentikan setState setelah unmount/reset
      controller.abort() // batalkan fetch
    }
  }, [waypoints, userLocation])

  useEffect(() => {
    if (!shelters.length) return

    // Buat index supercluster
    const index = new Supercluster({
      radius: 300, // pixel radius cluster
      maxZoom: 20,
      minPoints: 5,
    })

    // Format ulang shelter ke GeoJSON Point
    const points = shelters.map((f) => ({
      type: "Feature",
      properties: {
        cluster: false,
        shelterId: f.properties?.id,
        name: f.properties?.name,
        address: f.properties?.address,
        facilityType: f.properties?.facilityType,
        seatingCapacity: f.properties?.seatingCapacity,
      },
      geometry: {
        type: "Point",
        coordinates: f.geometry.coordinates, // [lng, lat]
      },
    }))

    index.load(points)
    setSupercluster(index)
  }, [shelters])

  useEffect(() => {
    if (!mapRef.current || !supercluster) return

    const map = mapRef.current
    const bounds = map.getBounds()
    if (!bounds) return

    const zoom = map.getZoom()
    const bbox = [
      bounds.getSouthWest().lng(),
      bounds.getSouthWest().lat(),
      bounds.getNorthEast().lng(),
      bounds.getNorthEast().lat(),
    ]

    const clusters = supercluster.getClusters(bbox, zoom)
    setClusters(clusters)
  }, [supercluster, mapReady])

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
            center={mapCenter} // ganti dari disasterPoint
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
                {routePath && routePath.length > 0 && layersData.length > 0 && (
                  <Polyline
                    key={
                      layersData.length > 0
                        ? "polyline-active"
                        : "polyline-inactive"
                    }
                    path={layersData.length > 0 ? routePath : []}
                    options={{
                      strokeColor: "#0000F1",
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
                          strokeWeight: 0,
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
                          strokeWeight: 0,
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
                      title={
                        `${f.properties?.name} (Click to see details)` ||
                        "Evacuation Shelter (Click to see details)"
                      }
                      onClick={() => {
                        setSelectedShelter(f)
                        setDialogIsOpen(true)
                      }}
                    />
                  )
                })}

                {clusters.map((cluster, i) => {
                  const [lng, lat] = cluster.geometry.coordinates
                  const { cluster: isCluster, point_count: pointCount } =
                    cluster.properties

                  if (isCluster) {
                    // render cluster bubble
                    return (
                      <OverlayView
                        key={`cluster-${i}`}
                        position={{ lat, lng }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            background:
                              "radial-gradient(circle at center, rgba(0, 0, 255, 0.8), rgba(0, 0, 255, 0.6), rgba(255, 255, 255, 0.5))", // biru utama
                            color: "white",
                            fontSize: "10px",
                            width: 34,
                            height: 34,
                            cursor: "pointer",
                          }}
                        >
                          {pointCount}
                        </div>
                      </OverlayView>
                    )
                  }

                  // render single marker
                  return (
                    <Marker
                      key={`shelter-${i}`}
                      position={{ lat, lng }}
                      icon={{
                        url: `https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/clinic_4970758.png`,
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 32),
                      }}
                      title={
                        `${cluster.properties.name} (Click to see details)` ||
                        "Evacuation Shelter (Click to see details)"
                      }
                      onClick={() => {
                        setSelectedShelter({
                          properties: cluster.properties,
                          geometry: cluster.geometry,
                        })
                        setDialogIsOpen(true)
                      }}
                    />
                  )
                })}

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
                    <HoverCard
                      openDelay={0}
                      className=""
                    >
                      <div className="w-20 h-20 relative">
                        <div className=" bg-blue-600 opacity-40 rounded-full w-13 h-13 relative -left-[18px] -top-1/4"></div>
                        <HoverCardTrigger className="relative -top-8/12">
                          <div className="h-4 w-4 border-2 rounded-full bg-blue-700 border-white"></div>
                        </HoverCardTrigger>
                      </div>
                      <HoverCardContent
                        className={"w-fit py-1 px-2 text-center"}
                      >
                        You are here
                      </HoverCardContent>
                    </HoverCard>
                  </OverlayView>
                )}

                {/* Titik gempa */}
                {disasterPoint.lat && (
                  <OverlayView
                    position={disasterPoint}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <HoverCard openDelay={0}>
                      <HoverCardTrigger>
                        <div className="h-6 w-6 border-2 bg-red-500 rounded-full flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            fill="white"
                            className="bi bi-exclamation-triangle-fill"
                            viewBox="0 0 18 18"
                          >
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
                          </svg>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent
                        className={"w-fit py-1 px-2 text-center"}
                      >
                        Disaster point
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
                onClick={getUserLoc}
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
