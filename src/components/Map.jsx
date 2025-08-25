import React, { useEffect, useState } from "react"
import GoogleMaps from "./GoogleMaps"
import Navigation from "./Navigation"
import { getLayers } from "@/supabase/actions/layer"
import { toast } from "sonner"

function Map() {
  const [layers, setLayers] = useState([])
  const [currentLayer, setCurrentLayer] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {}, [])

  useEffect(() => {
    const fetchLayers = async () => {
      setLoading(true)
      try {
        const data = await getLayers()
        setLayers(data)
        setCurrentLayer(data[0])

        if (!data.length) {
          toast.error(
            "There is no prediction layer at this time, please come back later",
            {
              duration: Infinity,
              closeButton: <div>Close</div>,
              position: "bottom-center",
            }
          )
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLayers()
  }, [])

  return (
    <div className="flex-1">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <GoogleMaps
            layers={layers}
            currentLayer={currentLayer}
            setCurrentLayer={setCurrentLayer}
          />
          <Navigation
            layers={layers}
            currentLayer={currentLayer}
            setCurrentLayer={setCurrentLayer}
          />
        </>
      )}
    </div>
  )
}

export default Map
