import {
  GoogleMap,
  Marker,
  Polygon,
  Polyline,
  OverlayView,
} from "@react-google-maps/api"
import Supercluster from "supercluster"
import CustomZoom from "./CustomZoom"
import { useMapContext } from "@/context/MapContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MarkerClusterer } from "@react-google-maps/api"
import React, { useRef, useState, useCallback, useEffect, useMemo } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "./ui/button"
import {
  CarFront,
  Dot,
  Info,
  LocateFixed,
  Merge,
  Navigation2,
  Route,
  TrendingUp,
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
import { marker, point } from "leaflet"
import CustomPopup from "./CustomPopup"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import { Checkbox } from "./ui/checkbox"
import RouteFormLabel from "./RouteFormLabel"
import fetchGeoJSON from "@/utils/fetchGeoJSON"
import {
  getNearestHospitals,
  isOutsideKanto,
  isOutsideChiba,
} from "@/utils/geoUtils"
import { Badge } from "./ui/badge"

const items = [
  {
    id: "ai_recommended_route",
    label: "AI Recommended Route",
  },
  {
    id: "walk",
    label: "Walk",
  },
  {
    id: "drive",
    label: "Drive",
  },
  {
    id: "official_emergency_route",
    label: "Official Emergency Route",
  },
  {
    id: "official_emergency_road",
    label: "Official Emergency Road",
  },
]

const FormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
})

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
      label:
        feature.properties?.composite_risk_class ||
        feature.properties?.Label ||
        "default",
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

function GoogleMaps({
  currentLayer,
  searchResult,
  evacuationType,
  setEvacuationType,
}) {
  const { data: layersData, status } = useSelector((state) => state.layers)

  const [loading, setLoading] = useState(false)
  const [polygons, setPolygons] = useState([])
  const [routePath, setRoutePath] = useState([])
  const [shelters, setShelters] = useState([])
  const mapRef = useRef(null)
  const [waypoints, setWaypoints] = useState([]) // simpan titik2 pilihan user
  const [waypointMarkers, setWaypointMarkers] = useState([])
  const [dialogIsOpen, setDialogIsOpen] = useState(false)
  const [routeTypeDialogOpen, setRouteTypeDialogOpen] = useState(false)
  const [selectedShelter, setSelectedShelter] = useState()
  const [mapReady, setMapReady] = useState(false)
  const [clusters, setClusters] = useState([])
  const [supercluster, setSupercluster] = useState(null)
  const [disasterPoint, setDisasterPoint] = useState({})
  const [userLocation, setUserLocation] = useState({})
  const [mapCenter, setMapCenter] = useState(center) // default center
  const [redRoute, setRedRoute] = useState([])
  const [popup, setPopup] = useState(null)
  const [markers, setMarkers] = useState([])
  const { setFindNearby } = useMapContext()
  const [road, setRoad] = useState([])
  const [currentMarker, setCurrentMarker] = useState(null)
  const dataReady = useMemo(() => {
    return (
      !!userLocation.lat &&
      shelters.length > 0 &&
      polygons.length > 0 &&
      !!disasterPoint.lat &&
      evacuationType.point_type === "evacuation_point"
    )
  }, [
    userLocation,
    shelters,
    polygons,
    disasterPoint,
    evacuationType.point_type,
  ])

  // const [userLocation, setUserLocation] = useState({
  //   lat: 35.20307959805068,
  //   lng: 140.3732847887497,
  // })

  const form = useForm({
    defaultValues: {
      items: ["ai_recommended_route", "drive"],
    },
    resolver: zodResolver(FormSchema),
  })

  const watchedItems = form.watch("items") || []

  async function findNearbyHospitals(type, mode) {
    // === Sync form state & evacuationType ===
    form.reset({
      items: ["ai_recommended_route", "drive"],
    })
    setEvacuationType((prev) => ({
      ...prev,
      mode: "drive",
    }))

    if (mode) {
      setEvacuationType({ point_type: evacuationType.point_type, mode })
    }

    setMarkers([])
    setEvacuationType({ point_type: `${type}`, mode: evacuationType.mode })

    if (type === "evacuation_point") {
      try {
        const position = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject)
        )

        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        setUserLocation(pos)

        // pastikan shelter & polygons sudah ter-load
        if (shelters.length && polygons.length) {
          await planEvacuationRoute(pos, shelters, polygons)
        } else {
          toast.info("Shelters or risk map not loaded yet.")
        }
      } catch (err) {
        console.error("Error getting location for evacuation route:", err)
      }
      return
    }

    setSupercluster(null)
    setClusters([])
    setWaypoints([])
    setWaypointMarkers([])
    setRoutePath([])
    setRedRoute([])

    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      )

      // const pos = {
      //   lat: 35.45456754343619,
      //   lng: 139.96284726653911,
      // }

      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }

      setUserLocation(pos)

      let description
      let url
      if (type === "main") {
        url = import.meta.env.VITE_SUPABASE_MAIN_HOSPITALS_URL
        description =
          "We’ll show all main hospitals in Chiba instead of the nearest ones."
      } else if (type === "local") {
        url = import.meta.env.VITE_SUPABASE_LOCAL_HEALTHCENTERS_URL
        description =
          "We’ll show all emergency hospitals in Chiba instead of the nearest ones."
      }

      let geojson = await fetchGeoJSON(url)

      const outsideKanto = isOutsideKanto(pos)

      if (outsideKanto) {
        toast.info("You’re currently outside Kanto Region.", {
          description,
          id: "outside-kanto",
          duration: Number.POSITIVE_INFINITY,
        })
      }

      const hospitals = geojson.features.map((f) => ({
        name: f.properties.name,
        name_en: f.properties.name_en,
        type: f.properties.type,
        address: f.properties.address,
        zip_code: f.properties.zip_code,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      }))

      const shown = !outsideKanto
        ? getNearestHospitals(pos, hospitals, 3)
        : hospitals

      setMarkers(shown)

      if (!outsideKanto) {
        buildSingleSafeRoute(shown[0], mode)
        setCurrentMarker(shown[0])
      }
    } catch (err) {
      console.error("Error finding hospitals:", err)
    }
  }

  useEffect(() => {
    if (userLocation.lat || disasterPoint.lat) {
      setFindNearby(() => findNearbyHospitals)
    }
  }, [setFindNearby, userLocation, disasterPoint])

  function getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          // const pos = {
          //   lat: 35.45456754343619,
          //   lng: 139.96284726653911,
          // }

          setUserLocation(pos)

          console.log("testt")

          if (isOutsideChiba(pos)) {
            if (disasterPoint.lat) {
              setMapCenter(disasterPoint)
              mapRef.current?.panTo(disasterPoint)
              toast.info("You’re currently outside Chiba.", {
                description:
                  "We don’t have data for your location yet. The evacuation routes shown are from the disaster point to the safest point, not from your current location.",

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
    setMapCenter(searchResult)
  }, [searchResult])

  useEffect(() => {
    // if (disasterPoint.lat) {
    if (evacuationType.point_type === "evacuation_point") {
      getCurrentLocation()
    }
    // }
  }, [disasterPoint, evacuationType.point_type])

  useEffect(() => {
    if (evacuationType.point_type !== "evacuation_point") {
      console.log(
        "🛑 [DataReady Effect] Skip: evacuationType bukan evacuation_point =>",
        evacuationType.point_type
      )
      return
    }

    if (dataReady) {
      console.log("✅ Semua data siap — memanggil planEvacuationRoute()")
      planEvacuationRoute(userLocation, shelters, polygons)
    } else {
      console.log("⏳ Data belum lengkap, menunggu semua dependency siap...")
    }
  }, [dataReady, evacuationType.point_type])

  useEffect(() => {
    if (evacuationType.point_type !== "evacuation_point") {
      console.log(
        "🛑 [BuildSafeRoute] Skip: evacuationType bukan evacuation_point =>",
        evacuationType.point_type
      )
      return
    }

    console.log("🧭 [BuildSafeRoute Effect] Triggered with:", {
      waypoints,
      userLocation,
      polygonsCount: polygons.length,
      disasterPoint,
    })

    // isi effect existing buildSafeRoute tetap, tapi tambah log di awal & akhir
  }, [waypoints, userLocation, polygons, disasterPoint, evacuationType])

  useEffect(() => {
    const anyMissing = !userLocation.lat || !shelters.length || !polygons.length

    if (anyMissing) {
      console.warn(
        "[Reset Warning] Beberapa data belum siap. Tidak menjalankan planEvacuationRoute."
      )
      setRoutePath([])
      setClusters([])
      setSupercluster(null)
    }
  }, [userLocation, shelters, polygons])

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

          console.log({ disasterPoint: disasterCenter })

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

          // const pos = {
          //   lat: 35.45456754343619,
          //   lng: 139.96284726653911,
          // }

          const isSameLocation = (a, b) => a.lat === b.lat && a.lng === b.lng

          if (!isSameLocation(userLocation, pos)) {
            setUserLocation(pos)
          }

          mapRef.current?.panTo(pos)

          if (isOutsideChiba(pos)) {
            toast.info("You’re currently outside Chiba.", {
              description: "We don’t have data for your location yet.",

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

  async function getSegmentRoute(origin, destination, mode) {
    let body = {}

    if (mode) {
      setEvacuationType({ point_type: evacuationType.point_type, mode })
    }

    if (
      (mode && mode === "walk") ||
      (!mode && evacuationType.mode === "walk")
    ) {
      body = {
        origin: {
          location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
        },
        destination: {
          location: {
            latLng: { latitude: destination.lat, longitude: destination.lng },
          },
        },
        travelMode: "WALK",
      }
    } else {
      body = {
        origin: {
          location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
        },
        destination: {
          location: {
            latLng: { latitude: destination.lat, longitude: destination.lng },
          },
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE_OPTIMAL",
        computeAlternativeRoutes: true,
        routeModifiers: {
          avoidHighways: false,
          avoidTolls: false,
          avoidFerries: true,
        },
      }
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
    return data?.routes || null
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

    if (
      mapReady &&
      currentLayer?.processed_url &&
      evacuationType.point_type === "evacuation_point"
    ) {
      loadProcessedShelters()
    }
  }, [mapReady, currentLayer?.processed_url, evacuationType.point_type])

  async function planEvacuationRoute(userLoc, shelters, polygons, id) {
    if (evacuationType.point_type !== "evacuation_point") return
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
      let candidates = shelters.filter(
        (h) =>
          h.properties.zoneLabel !== null &&
          h.properties.zoneLabel <= currentZone
      )

      if (id) {
        candidates.filter((h) => h.properties.id != id)
      }

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
        zoneLabel: nearest.properties.zoneLabel, // penting buat filter
        id: nearest.properties.id,
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
    if (
      !userLocation.lat &&
      !shelters.length &&
      !polygons.length &&
      evacuationType.point_type !== "evacuation_point"
    ) {
      setRoutePath([])
      // setWaypoints([])
      setWaypointMarkers([])
      if (shelters.length > 0) {
        setShelters([])
      }
      setClusters([])
      setSupercluster(null)
      return
    }

    const start =
      isOutsideChiba(userLocation) && disasterPoint.lat
        ? disasterPoint
        : userLocation

    // kalau ada semua baru plan
    planEvacuationRoute(start, shelters, polygons)
  }, [
    shelters,
    polygons,
    currentLayer,
    userLocation,
    disasterPoint,
    evacuationType,
  ])

  // Tambahkan useEffect baru
  useEffect(() => {
    if (
      userLocation.lat &&
      shelters.length > 0 &&
      polygons.length > 0 &&
      evacuationType.point_type === "evacuation_point"
    ) {
      console.log("✅ Semua data siap, menjalankan planEvacuationRoute...")
      planEvacuationRoute(userLocation, shelters, polygons)
    }
  }, [userLocation, shelters, polygons, evacuationType.point_type])

  function getZoneForPoint(point, polygons) {
    let zone = null
    const turfPoint = turf.point([point.lng, point.lat])

    for (const poly of polygons) {
      const geom =
        poly.type === "Polygon"
          ? turf.polygon(poly.coordinates)
          : turf.multiPolygon(poly.coordinates)

      if (turf.booleanPointInPolygon(turfPoint, geom)) {
        zone = Number(poly.label)
        break
      }
    }
    return zone
  }

  // helper buat hitung bahaya rute
  function countDangerPoints(path, polygons, fromZone) {
    let dangerCount = 0

    path.forEach((coordinate) => {
      const point = turf.point([coordinate.lng, coordinate.lat])
      polygons.forEach((poly) => {
        let geom
        if (poly.type === "Polygon") {
          geom = turf.polygon(poly.coordinates)
        } else if (poly.type === "MultiPolygon") {
          geom = turf.multiPolygon(poly.coordinates)
        }

        if (turf.booleanPointInPolygon(point, geom)) {
          if (poly.label > fromZone) {
            dangerCount++
            setRedRoute((r) => [
              ...r,
              { lng: coordinate.lng, lat: coordinate.lat },
            ])
          }
        }
      })
    })

    return dangerCount
  }

  function extractDangerSegments(path, polygons, fromZone) {
    let redSegments = []
    let currentSegment = []

    path.forEach((coordinate) => {
      const point = turf.point([coordinate.lng, coordinate.lat])
      let isDanger = false

      polygons.forEach((poly) => {
        let geom =
          poly.type === "Polygon"
            ? turf.polygon(poly.coordinates)
            : turf.multiPolygon(poly.coordinates)

        if (turf.booleanPointInPolygon(point, geom)) {
          if (poly.label > fromZone) {
            isDanger = true
          }
        }
      })

      if (isDanger) {
        currentSegment.push(coordinate)
      } else {
        if (currentSegment.length > 0) {
          redSegments.push(currentSegment)
          currentSegment = []
        }
      }
    })

    if (currentSegment.length > 0) {
      redSegments.push(currentSegment)
    }

    return redSegments
  }

  useEffect(() => {
    console.log({ routePath })
  }, [routePath])

  async function buildSingleSafeRoute(destination, mode) {
    if (isOutsideKanto(userLocation)) {
      toast.info("You’re currently outside Kanto Region.", {
        description:
          "We’ll show all main hospitals in Chiba instead of the nearest ones.",

        id: "outside-chiba",
        duration: Number.POSITIVE_INFINITY,
      })
      return
    }

    const routes = await getSegmentRoute(userLocation, destination, mode)

    let allRoutes = []

    console.log({ routes })

    routes.forEach((route, altIdx) => {
      let fullPath = []
      route.legs.forEach((leg) => {
        leg.steps.forEach((step) => {
          const stepPath = polyline
            .decode(step.polyline.encodedPolyline)
            .map(([lat, lng]) => ({ lat, lng }))
          fullPath = fullPath.concat(stepPath)
        })
      })

      allRoutes.push({
        path: fullPath,
      })
    })

    console.log({ allRoutes })

    setRoutePath([allRoutes[0]])
  }

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function buildSafeRoute() {
      if (!waypoints.length) {
        setRoutePath([])
        return
      }

      const basePoint = isOutsideChiba(userLocation)
        ? disasterPoint
        : userLocation
      const zoneLabel = getZoneForPoint(basePoint, polygons)

      if (zoneLabel == null) {
        console.warn("Tidak menemukan zona untuk titik awal")
        setRoutePath([])
        return
      }

      const origin = { ...basePoint, zoneLabel }

      let fullPath = []
      let currentPoint = origin
      let allRoutes = []

      for (let i = 0; i < waypoints.length; i++) {
        const destination = waypoints[i]
        const fromZone = currentPoint.zoneLabel
        const toZone = destination.zoneLabel ?? 0

        const routes = await getSegmentRoute(currentPoint, destination)
        if (!routes) break

        // untuk setiap alternatif
        routes.forEach((route, altIdx) => {
          let fullPath = []
          route.legs.forEach((leg) => {
            leg.steps.forEach((step) => {
              const stepPath = polyline
                .decode(step.polyline.encodedPolyline)
                .map(([lat, lng]) => ({ lat, lng }))
              fullPath = fullPath.concat(stepPath)
            })
          })

          const dangerScore = countDangerPoints(fullPath, polygons, fromZone)

          // cari segmen merah
          const redSegments = extractDangerSegments(
            fullPath,
            polygons,
            fromZone
          )

          allRoutes.push({
            waypointIndex: i,
            alternativeIndex: altIdx,
            path: fullPath,
            dangerScore,
            redSegments,
          })
        })

        currentPoint = destination
      }

      let safestRoute = []

      let route0 = []
      let route1 = []
      let route2 = []
      let route3 = []

      allRoutes.forEach((route) => {
        if (route.waypointIndex === 0) {
          route0.push(route)
        } else if (route.waypointIndex === 1) {
          route1.push(route)
        } else if (route.waypointIndex === 2) {
          route2.push(route)
        } else {
          route3.push(route)
        }
      })

      const safestRoute0 = route0.reduce((best, r) => {
        return !best || r.dangerScore < best.dangerScore ? r : best
      }, null)

      const safestRoute1 = route1.reduce((best, r) => {
        return !best || r.dangerScore < best.dangerScore ? r : best
      }, null)

      const safestRoute2 = route2.reduce((best, r) => {
        return !best || r.dangerScore < best.dangerScore ? r : best
      }, null)

      const safestRoute3 = route3.reduce((best, r) => {
        return !best || r.dangerScore < best.dangerScore ? r : best
      }, null)

      safestRoute = [safestRoute0, safestRoute1, safestRoute2, safestRoute3]

      if (active) setRoutePath(safestRoute)
    }

    console.log({ waypoints, userLocation, polygons, disasterPoint })

    if (
      waypoints.length > 0 &&
      userLocation?.lat &&
      polygons?.length > 0 &&
      disasterPoint?.lat &&
      evacuationType.point_type === "evacuation_point"
    ) {
      toast.promise(buildSafeRoute(), {
        id: "searchingRoute",
        loading: "Searching for evacuation route...",
        error:
          "We’re having trouble loading the route. Please check your internet connection and try again.",
        duration: 20000,
      })
    }

    return () => {
      active = false
      controller.abort()
    }
  }, [waypoints, userLocation, polygons, disasterPoint, evacuationType])

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

  const isChecked = (id) => watchedItems.includes(id)

  const toggle = (field, id, checked) => {
    let current = Array.isArray(field.value) ? [...field.value] : []

    // === CASE 1: User uncheck item ===
    if (!checked) {
      current = current.filter((v) => v !== id)

      // Jika user uncheck "ai_recommended_route", uncheck juga walk & drive
      if (id === "ai_recommended_route") {
        current = current.filter((v) => v !== "walk" && v !== "drive")
      }

      field.onChange(current)
      return
    }

    // === CASE 2: User check item ===
    // Tambahkan item baru
    current.push(id)

    // Drive dan Walk saling eksklusif
    if (id === "drive") {
      current = current.filter((v) => v !== "walk")
    }
    if (id === "walk") {
      current = current.filter((v) => v !== "drive")
    }

    field.onChange(current)
  }

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
            center={mapCenter}
            zoom={12}
            options={{
              disableDefaultUI: true,
              gestureHandling: "cooperative",
              mapTypeId: "hybrid",
            }}
            onLoad={onLoad}
            onIdle={handleIdle}
          >
            {mapReady && (
              <>
                {markers?.map((m, i) => (
                  <OverlayView
                    key={i}
                    position={{ lat: m.lat, lng: m.lng }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <HoverCard
                      openDelay={300}
                      className=""
                    >
                      <HoverCardTrigger className="relative -top-8/12 cursor-pointer">
                        <img
                          src={
                            evacuationType.point_type === "main"
                              ? `https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(1)%202.svg`
                              : `https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(2)%203.svg`
                          }
                          alt=""
                          srcset=""
                        />
                      </HoverCardTrigger>
                      <HoverCardContent className={"w-fit py-2 px-2"}>
                        <div className="flex gap-3">
                          <div className="desc">
                            <div className="font-semibold max-w-[200px]">
                              {m.name_en}
                            </div>
                            <Badge
                              variant="outline"
                              className="border-green-200 text-green-400 font-normal my-2"
                            >
                              {m.type}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {m.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {m.address}
                            </div>
                            <div className="text-xs text-gray-500">
                              {m.zip_code}
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant={"outline"}
                              disabled={isOutsideKanto(userLocation)}
                              onClick={() => {
                                console.log({ mode: evacuationType.mode })
                                buildSingleSafeRoute(m, evacuationType.mode)
                                setCurrentMarker(m)
                              }}
                            >
                              <TrendingUp />
                            </Button>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </OverlayView>
                ))}

                {/* Route Path */}
                {routePath?.length &&
                  routePath.map((r, i) => (
                    <React.Fragment
                      key={`route-${i}-${r?.waypointIndex}-${r?.alternativeIndex}`}
                    >
                      <Polyline
                        path={r?.path}
                        options={{
                          strokeColor: "#0000F1", // biru utama
                          strokeOpacity: 1,
                          strokeWeight: 4,
                          zIndex: 1000,
                        }}
                      />
                      {r?.redSegments?.map((seg, idx) => (
                        <Polyline
                          key={`red-${r?.waypointIndex}-${idx}`}
                          path={seg}
                          options={{
                            strokeColor: "#FF0000",
                            strokeOpacity: 1,
                            strokeWeight: 5,
                            zIndex: 1000,
                          }}
                          onMouseOver={(e) => {
                            setPopup({
                              position: e.latLng.toJSON(),
                              text: "⚠️ This section passes through a higher-risk area.",
                            })
                          }}
                          onMouseOut={() => setPopup(null)}
                        />
                      ))}
                    </React.Fragment>
                  ))}

                {/* Road */}
                {road?.length &&
                  road.map((r, i) => (
                    <React.Fragment
                      key={`route-${i}-${r?.waypointIndex}-${r?.alternativeIndex}`}
                    >
                      <Polyline
                        path={r?.path}
                        options={{
                          strokeColor: "#A9A9A9", // biru utama
                          strokeOpacity: 1,
                          strokeWeight: 2,
                          zIndex: 999,
                        }}
                      />
                    </React.Fragment>
                  ))}

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
                          clickable: false,
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
                          clickable: false,
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
                      onClick={() => {
                        setSelectedShelter(f)
                        setDialogIsOpen(true)
                      }}
                      onMouseOver={(e) => {
                        setPopup({
                          title: `Nearest Evacuation Point`,
                          position: e.latLng.toJSON(),
                          text: `${f.properties.name} (click to see details)`,
                        })
                      }}
                      onMouseOut={() => setPopup(null)}
                    />
                  )
                })}

                {popup && (
                  <CustomPopup
                    title={popup.title}
                    position={popup.position}
                    text={popup.text}
                    onClose={() => setPopup(null)}
                  />
                )}

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

                  // cek apakah shelter ini ada di waypointMarkers
                  const isWaypoint = waypointMarkers.some(
                    (w) => w.properties.id === cluster.properties.shelterId
                  )

                  // kalau dia waypoint → jangan render marker
                  if (isWaypoint) {
                    return null
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
                      onClick={() => {
                        setSelectedShelter({
                          properties: cluster.properties,
                          geometry: cluster.geometry,
                        })
                        setDialogIsOpen(true)
                      }}
                      onMouseOver={(e) => {
                        setPopup({
                          position: e.latLng.toJSON(),
                          text:
                            `${cluster.properties.name}  (Click to see details)` ||
                            "Evacuation Shelter (Click to see details)",
                        })
                      }}
                      onMouseOut={() => setPopup(null)}
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

                {/* Titik bencana */}
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
                        className={"w-fit py-1 px-2 text-center cursor-pointer"}
                        onClick={() => {
                          console.log("test")
                        }}
                      >
                        Disaster point
                      </HoverCardContent>
                    </HoverCard>
                  </OverlayView>
                )}

                {searchResult && (
                  <Marker
                    position={searchResult}
                    title="Search result"
                  />
                )}
              </>
            )}

            {/* Kontrol zoom & lokasi */}
            <div className="absolute bottom-20 right-2 flex flex-col gap-1 justify-end items-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size={"sm"}
                    onClick={handleZoomIn}
                    className="cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
                  >
                    <ZoomIn />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom in maps</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size={"sm"}
                    onClick={handleZoomOut}
                    className="cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
                  >
                    <ZoomOut />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom out maps</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size={"sm"}
                    className="w-min cursor-pointer bg-gray-50 hover:bg-gray-200 text-black"
                    onClick={getUserLoc}
                  >
                    <LocateFixed />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get your location</p>
                </TooltipContent>
              </Tooltip>

              {/* Dialog Route Type */}
              <Dialog
                open={routeTypeDialogOpen}
                onOpenChange={setRouteTypeDialogOpen}
              >
                <DialogTrigger>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size={"lg"}
                        className="h-[48px] flex cursor-pointer bg-gray-50 hover:bg-gray-200 text-black"
                      >
                        {evacuationType.mode === "drive" ? (
                          <CarFront />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-person-walking"
                            viewBox="0 0 16 16"
                          >
                            <path d="M9.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M6.44 3.752A.75.75 0 0 1 7 3.5h1.445c.742 0 1.32.643 1.243 1.38l-.43 4.083a1.8 1.8 0 0 1-.088.395l-.318.906.213.242a.8.8 0 0 1 .114.175l2 4.25a.75.75 0 1 1-1.357.638l-1.956-4.154-1.68-1.921A.75.75 0 0 1 6 8.96l.138-2.613-.435.489-.464 2.786a.75.75 0 1 1-1.48-.246l.5-3a.75.75 0 0 1 .18-.375l2-2.25Z" />
                            <path d="M6.25 11.745v-1.418l1.204 1.375.261.524a.8.8 0 0 1-.12.231l-2.5 3.25a.75.75 0 1 1-1.19-.914zm4.22-4.215-.494-.494.205-1.843.006-.067 1.124 1.124h1.44a.75.75 0 0 1 0 1.5H11a.75.75 0 0 1-.531-.22Z" />
                          </svg>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Change travel mode</p>
                    </TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Route Type</DialogTitle>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(async (data) => {
                          console.log(data)
                          console.log(evacuationType)
                          if (
                            data.items.includes("ai_recommended_route") &&
                            !data.items.includes("walk") &&
                            !data.items.includes("drive")
                          ) {
                            toast.error(
                              "Please select a mode (Driving or Walking) before continuing."
                            )
                            return // stop submit
                          }

                          setRouteTypeDialogOpen(false)

                          if (
                            (data.items.includes("ai_recommended_route") &&
                              data.items.includes("walk")) ||
                            data.items.includes("drive")
                          ) {
                            if (data.items.includes("walk")) {
                              setEvacuationType({
                                point_type: evacuationType.point_type,
                                mode: "walk",
                              })

                              if (
                                evacuationType.point_type !== "evacuation_point"
                              ) {
                                buildSingleSafeRoute(currentMarker, "walk")
                              }

                              if (
                                road.length &&
                                !data.items.includes("official_emergency_road")
                              ) {
                                setRoad([])
                                findNearbyHospitals(
                                  evacuationType.point_type,
                                  "walk"
                                )
                              }
                            } else if (data.items.includes("drive")) {
                              setEvacuationType({
                                point_type: evacuationType.point_type,
                                mode: "drive",
                              })

                              if (
                                evacuationType.point_type !== "evacuation_point"
                              ) {
                                buildSingleSafeRoute(currentMarker, "drive")
                              }

                              if (
                                road.length &&
                                !data.items.includes("official_emergency_road")
                              ) {
                                setRoad([])
                                findNearbyHospitals(
                                  evacuationType.point_type,
                                  "drive"
                                )
                              }
                            }
                          }

                          if (data.items.includes("official_emergency_road")) {
                            if (!data.items.includes("ai_recommended_route")) {
                              setMarkers([])
                              setRoutePath([])
                              setClusters([])
                              setSupercluster(null)
                              setWaypointMarkers([])
                            }

                            if (!road.length) {
                              try {
                                const url = import.meta.env
                                  .VITE_SUPABASE_EMERGENCY_ROAD_URL
                                console.log("Fetching from:", url)

                                const res = await fetch(url)
                                if (!res.ok)
                                  throw new Error(
                                    `Failed to fetch GeoJSON (${res.status})`
                                  )

                                const data = await res.json()
                                console.log("GeoJSON result:", data)

                                if (!data?.features) {
                                  console.warn("No features found in GeoJSON")
                                  return
                                }

                                // === Convert LineString ke routePath ===
                                const lineFeatures = data.features.filter(
                                  (f) => f.geometry?.type === "LineString"
                                )

                                const converted = lineFeatures.map(
                                  (f, idx) => ({
                                    waypointIndex: idx,
                                    alternativeIndex: 0,
                                    path: f.geometry.coordinates.map(
                                      ([lng, lat]) => ({ lat, lng })
                                    ),
                                    redSegments: [],
                                  })
                                )

                                setRoad(converted)
                              } catch (err) {
                                console.error("❌ Error fetching GeoJSON:", err)
                              }
                            }
                          }
                        })}
                        className="space-y-8 mt-2"
                      >
                        {/* AI Recommended Route */}
                        <FormField
                          control={form.control}
                          name="items"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={isChecked("ai_recommended_route")}
                                  // disabled={isChecked(
                                  //   "official_emergency_road"
                                  // )}
                                  onCheckedChange={(checked) =>
                                    toggle(
                                      field,
                                      "ai_recommended_route",
                                      checked
                                    )
                                  }
                                />
                              </FormControl>
                              <RouteFormLabel
                                id="ai_recommended_route"
                                label="AI Recommended Route"
                                // disabled={isChecked("official_emergency_road")}
                              />
                            </FormItem>
                          )}
                        />

                        {/* === Road Mode === */}
                        <FormField
                          control={form.control}
                          name="items"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-2 ms-6">
                              <FormControl>
                                <Checkbox
                                  checked={isChecked("drive")}
                                  disabled={!isChecked("ai_recommended_route")}
                                  onCheckedChange={(checked) =>
                                    toggle(field, "drive", checked)
                                  }
                                />
                              </FormControl>
                              <RouteFormLabel
                                id="drive"
                                label="Driving Mode (default)"
                                disabled={!isChecked("ai_recommended_route")}
                              />
                            </FormItem>
                          )}
                        />

                        {/* === Walk Mode === */}
                        <FormField
                          control={form.control}
                          name="items"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-2 ms-6">
                              <FormControl>
                                <Checkbox
                                  checked={isChecked("walk")}
                                  disabled={!isChecked("ai_recommended_route")}
                                  onCheckedChange={(checked) =>
                                    toggle(field, "walk", checked)
                                  }
                                />
                              </FormControl>
                              <RouteFormLabel
                                id="walk"
                                label="Walking Mode"
                                disabled={!isChecked("ai_recommended_route")}
                              />
                            </FormItem>
                          )}
                        />

                        {/* Official Emergency Route */}
                        <FormField
                          control={form.control}
                          name="items"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={isChecked(
                                    "official_emergency_route"
                                  )}
                                  disabled
                                  onCheckedChange={(checked) =>
                                    toggle(
                                      field,
                                      "official_emergency_route",
                                      checked
                                    )
                                  }
                                />
                              </FormControl>
                              <RouteFormLabel
                                id="official_emergency_route"
                                label="Official Emergency Route (soon)"
                                disabled
                              />
                            </FormItem>
                          )}
                        />

                        {/* Road Layer (Official Emergency Road) */}
                        <div className="mt-6">
                          <div className="text-lg font-semibold">
                            Road Layer
                          </div>
                          <FormField
                            control={form.control}
                            name="items"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center gap-2 mt-2">
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked(
                                      "official_emergency_road"
                                    )}
                                    // disabled={isChecked("ai_recommended_route")}
                                    onCheckedChange={(checked) =>
                                      toggle(
                                        field,
                                        "official_emergency_road",
                                        checked
                                      )
                                    }
                                  />
                                </FormControl>
                                <RouteFormLabel
                                  id="official_emergency_road"
                                  label="Official Emergency Road"
                                  // disabled={isChecked("ai_recommended_route")}
                                />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormMessage />
                        <Button type="submit">Submit</Button>
                      </form>
                    </Form>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </GoogleMap>
        </>
      )}
    </div>
  )
}

export default GoogleMaps
