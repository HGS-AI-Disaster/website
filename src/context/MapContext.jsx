// File: src/context/MapContext.jsx
import { createContext, useContext, useState } from "react"

const MapContext = createContext()

export const MapProvider = ({ children }) => {
  const [findNearby, setFindNearby] = useState(null)
  const [evacuationType, setEvacuationType] = useState({
    point_type: "evacuation_point",
    mode: "drive",
  })

  return (
    <MapContext.Provider
      value={{ findNearby, setFindNearby, evacuationType, setEvacuationType }}
    >
      {children}
    </MapContext.Provider>
  )
}

export const useMapContext = () => useContext(MapContext)
