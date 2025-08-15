import React, { useEffect, useState } from "react"
import GoogleMaps from "./GoogleMaps"
import Navigation from "./Navigation"

function Map() {
  const [layers, setLayers] = useState([])
  const [currentLayer, setCurrentLayer] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getLayers = async () => {
      setLoading(true)
      try {
        const res = await fetch("http://localhost:3000/api/layer")
        const json = await res.json()
        if (!res.ok) throw new Error(json.message || "Gagal fetch layer")
        setLayers(json.data)
        setCurrentLayer(json.data[0])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getLayers()
  }, [])

  return (
    <div className="h-full">
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
