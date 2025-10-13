// File: src/context/MapContext.jsx
import { createContext, useContext, useState } from "react"

const MapContext = createContext()

export const MapProvider = ({ children }) => {
  const [findNearby, setFindNearby] = useState(null)

  return (
    <MapContext.Provider value={{ findNearby, setFindNearby }}>
      {children}
    </MapContext.Provider>
  )
}

export const useMapContext = () => useContext(MapContext)
