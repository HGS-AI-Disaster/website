import React from "react"
import "leaflet/dist/leaflet.css"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import CustomZoom from "./CustomZoom"
import "leaflet/dist/leaflet.css"

function Map() {
  const position = [35.6074, 140.1065]
  return (
    <div className="absolute top-0 left-0 w-full h-[611.5px] z-10">
      <MapContainer
        center={position}
        zoom={12}
        scrollWheelZoom={false}
        zoomControl={false}
        className="w-full h-full"
      >
        {/* ESRI SATELLITE TILE */}
        {/* Basemap satelit */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />

        {/* Overlay label transparan */}
        <TileLayer
          url="https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution="Labels &copy; Esri"
          opacity={0.9}
        />
        <CustomZoom />
      </MapContainer>
    </div>
  )
}

export default Map
