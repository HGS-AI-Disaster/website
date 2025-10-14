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
import React, { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "./ui/button"
import {
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
import { getNearestHospitals, isOutsideChiba } from "@/utils/geoUtils"

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
  const [redRoute, setRedRoute] = useState([])
  const [popup, setPopup] = useState(null)
  const [markers, setMarkers] = useState([])
  const { setFindNearby } = useMapContext()
  const [evacuationType, setEvacuationType] = useState("evacuation_point")
  // const [userLocation, setUserLocation] = useState({
  //   lat: 35.20307959805068,
  //   lng: 140.3732847887497,
  // })

  const form = useForm({
    defaultValues: {
      items: [],
    },
    resolver: zodResolver(FormSchema),
  })

  const watchedItems = form.watch("items") || []

  function onSubmit(data) {
    toast("You submitted the following values", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  async function findNearbyHospitals(type) {
    setMarkers([])
    setEvacuationType(`${type}`)
    if (type === "evacuation_point") {
      return
    }
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

      let description
      let url
      if (type === "main") {
        url = import.meta.env.VITE_SUPABASE_MAIN_HOSPITALS_URL
        description =
          "We’ll show all main hospitals in Chiba instead of the nearest ones."
      } else if (type === "local") {
        url = import.meta.env.VITE_SUPABASE_LOCAL_HEALTHCENTERS_URL
        description =
          "We’ll show all local healthcares in Chiba instead of the nearest ones."
      }

      let geojson = await fetchGeoJSON(url)

      const insideChiba = !isOutsideChiba(pos)

      if (!insideChiba) {
        toast.info("You’re currently outside Chiba.", {
          description,
          // duration: Infinity,
          id: "outside-chiba",
          duration: Number.POSITIVE_INFINITY,
        })
      }

      const hospitals = geojson.features.map((f) => ({
        name: f.properties.name_en,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      }))

      const shown = insideChiba
        ? getNearestHospitals(pos, hospitals, 3)
        : hospitals

      setMarkers(shown)

      if (insideChiba) {
        buildSingleSafeRoute(shown[0])
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
    setMapCenter(searchResult)
  }, [searchResult])

  useEffect(() => {
    // if (disasterPoint.lat) {
    if (evacuationType === "evacuation_point") {
      getCurrentLocation()
    }
    // }
  }, [disasterPoint, evacuationType])

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

  async function getSegmentRoute(origin, destination) {
    const body = {
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
      console.log("running inside loadProcessedShelters")
      if (!currentLayer?.processed_url) return
      console.log("running inside loadProcessedShelters 2")

      try {
        console.log("try...")

        const res = await fetch(currentLayer.processed_url)
        console.log({ res })
        console.log("try 2...")

        const data = await res.json()
        console.log(data)

        if (data.type === "FeatureCollection") {
          console.log({ feature: data.feature })
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
      evacuationType === "evacuation_point"
    ) {
      loadProcessedShelters()
    }
  }, [mapReady, currentLayer?.processed_url, evacuationType])

  async function planEvacuationRoute(userLoc, shelters, polygons, id) {
    console.log("planEvacuationRoute berjalan")
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
    console.log({ userLocation, shelters, polygons, evacuationType })
    console.log(
      !userLocation.lat ||
        !shelters.length ||
        !polygons.length ||
        evacuationType !== "evacuation_point"
    )

    if (
      !userLocation.lat ||
      !shelters.length ||
      !polygons.length ||
      evacuationType !== "evacuation_point"
    ) {
      setRoutePath([])
      setWaypoints([])
      setWaypointMarkers([])
      // if (shelters.length > 0) {
      //   setShelters([])
      // }
      setShelters([])
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

  async function buildSingleSafeRoute(destination) {
    if (isOutsideChiba(userLocation)) {
      toast.info("You’re currently outside Chiba.", {
        description:
          "We’ll show all main hospitals in Chiba instead of the nearest ones.",
        // duration: Infinity,
        id: "outside-chiba",
        duration: Number.POSITIVE_INFINITY,
      })
      return
    }

    const routes = await getSegmentRoute(userLocation, destination)

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

    const dataReady =
      waypoints.length > 0 &&
      userLocation?.lat &&
      polygons?.length > 0 &&
      disasterPoint?.lat

    if (!dataReady) return

    toast.promise(buildSafeRoute(), {
      id: "searchingRoute",
      loading: "Searching for evacuation route...",
      error:
        "We’re having trouble loading the route. Please check your internet connection and try again.",
      duration: 20000,
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [
    waypoints.length,
    userLocation?.lat,
    polygons?.length,
    disasterPoint?.lat,
  ])

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
    const current = field.value ?? []
    field.onChange(checked ? [...current, id] : current.filter((v) => v !== id))
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
                      openDelay={0}
                      className=""
                    >
                      <HoverCardTrigger className="relative -top-8/12">
                        <img
                          src={
                            evacuationType === "main"
                              ? `https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(1)%202.svg`
                              : `https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(2)%203.svg`
                          }
                          alt=""
                          srcset=""
                        />
                      </HoverCardTrigger>
                      <HoverCardContent className={"w-fit py-2 px-2"}>
                        <div className="font-semibold mb-2">{m.name}</div>
                        <div className="flex items-center justify-end">
                          <Button
                            variant={"outline"}
                            disabled={isOutsideChiba(userLocation)}
                            onClick={() => {
                              buildSingleSafeRoute(m)
                            }}
                          >
                            <TrendingUp />
                            Direction
                          </Button>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </OverlayView>
                ))}

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
                          zIndex: 999,
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
                    title="Search result"
                  />
                )}
              </>
            )}

            {/* Kontrol zoom & lokasi */}
            <div className="absolute bottom-20 right-2 flex flex-col gap-1 justify-end items-end">
              <Button
                size={"sm"}
                onClick={handleZoomIn}
                className="cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
              >
                <ZoomIn />
              </Button>
              <Button
                size={"sm"}
                onClick={handleZoomOut}
                className="cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
              >
                <ZoomOut />
              </Button>
              <Button
                size={"sm"}
                className="w-min cursor-pointer bg-gray-50 hover:bg-gray-200 text-black"
                onClick={getUserLoc}
              >
                <LocateFixed />
              </Button>

              <Dialog>
                <DialogTrigger>
                  <Button
                    size={"lg"}
                    className=" h-[48px] cursor-pointer bg-gray-50 hover:bg-gray-200 text-black"
                  >
                    <Route />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Route Type</DialogTitle>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit((data) =>
                          console.log(data)
                        )}
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
                                  disabled={isChecked(
                                    "official_emergency_road"
                                  )}
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
                                disabled={isChecked("official_emergency_road")}
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
                                  disabled={
                                    !isChecked("ai_recommended_route") ||
                                    isChecked("official_emergency_road")
                                  }
                                  onCheckedChange={(checked) =>
                                    toggle(field, "walk", checked)
                                  }
                                />
                              </FormControl>
                              <RouteFormLabel
                                id="walk"
                                label="Walking Mode"
                                disabled={
                                  !isChecked("ai_recommended_route") ||
                                  isChecked("official_emergency_road")
                                }
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
                                  disabled={
                                    !isChecked("ai_recommended_route") ||
                                    isChecked("official_emergency_road")
                                  }
                                  onCheckedChange={(checked) =>
                                    toggle(field, "drive", checked)
                                  }
                                />
                              </FormControl>
                              <RouteFormLabel
                                id="drive"
                                label="Driving Mode"
                                disabled={
                                  !isChecked("ai_recommended_route") ||
                                  isChecked("official_emergency_road")
                                }
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
                                    disabled={isChecked("ai_recommended_route")}
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
                                  disabled={isChecked("ai_recommended_route")}
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
