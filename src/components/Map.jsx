import React, { useEffect, useState } from "react"
import { useJsApiLoader } from "@react-google-maps/api"
import GoogleMaps from "./GoogleMaps"
import Navigation from "./Navigation"
import { getLayers, getPublicLayers } from "@/supabase/actions/layer"
import { toast } from "sonner"
import { data } from "react-router-dom"
import { useSelector } from "react-redux"

const libraries = ["places", "visualization"]

function Map() {
  const layersData = useSelector((state) => state.layers.data)

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const [layers, setLayers] = useState([])
  const [currentLayer, setCurrentLayer] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchResult, setSearchResult] = useState(null)

  useEffect(() => {
    setLoading(true)
    if (layersData.length) {
      const validLayers = layersData.filter((l) => l.file_url)
      setCurrentLayer(validLayers[0] || null)
    }
    setLoading(false)

    // const fetchLayers = async () => {
    //   setLoading(true)
    //   try {
    //     const data = await getPublicLayers()

    //     const validLayers = data.filter((l) => l.file_url)
    //     setLayers(validLayers)
    //     setCurrentLayer(validLayers[0] || null)

    //     if (!data.length) {
    //       toast.error(
    //         "There is no prediction layer at this time, please come back later",
    //         {
    //           duration: Infinity,
    //           closeButton: <div>Close</div>,
    //           position: "bottom-center",
    //         }
    //       )
    //     }
    //   } catch (err) {
    //     setError(err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }

    // fetchLayers()
  }, [layersData])

  if (!isLoaded || loading) return <p>Loading Map...</p>

  return (
    <div className="flex-1">
      <GoogleMaps
        searchResult={searchResult}
        currentLayer={currentLayer}
      />

      <Navigation
        setSearchResult={setSearchResult}
        layers={layersData}
        currentLayer={currentLayer}
        setCurrentLayer={setCurrentLayer}
      />
    </div>
  )
}

export default Map
