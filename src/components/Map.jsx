import React, { useEffect, useState } from "react"
import { useJsApiLoader } from "@react-google-maps/api"
import GoogleMaps from "./GoogleMaps"
import Navigation from "./Navigation"
import { useSelector } from "react-redux"
import { MapProvider } from "@/context/MapContext"

const libraries = ["places", "visualization"]

function Map() {
  const layersData = useSelector((state) => state.layers.data)

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const [currentLayer, setCurrentLayer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchResult, setSearchResult] = useState(null)
  const [findNearby, setFindNearby] = useState(null)

  useEffect(() => {
    setLoading(true)
    if (layersData.length) {
      const validLayers = layersData.filter((l) => l.file_url)
      const visibleLayers = validLayers.filter((l) => l.visibility === "public")
      setCurrentLayer(visibleLayers[0] || null)
    } else {
      setCurrentLayer(null)
    }
    setLoading(false)
  }, [layersData])

  if (!isLoaded || loading) return <p>Loading Map...</p>

  return (
    <MapProvider>
      <div className="flex-1">
        <GoogleMaps
          searchResult={searchResult}
          currentLayer={currentLayer}
          onReady={setFindNearby}
        />

        <Navigation
          setSearchResult={setSearchResult}
          layers={layersData}
          currentLayer={currentLayer}
          setCurrentLayer={setCurrentLayer}
          // findNearby={findNearby}
        />
      </div>
    </MapProvider>
  )
}

export default Map
