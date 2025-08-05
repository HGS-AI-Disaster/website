import { GoogleMap, useJsApiLoader } from "@react-google-maps/api"

const containerStyle = {
  width: "100%",
  height: "100vh",
  position: "absolute",
  top: "0",
  left: "0",
}

const center = {
  lat: 35.6074, // Chiba
  lng: 140.1065,
}

function GoogleMaps() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  return isLoaded ? (
    <div className="z-10">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        options={{
          disableDefaultUI: true, // Remove default controls
          gestureHandling: "greedy", // Allow full gesture interaction
          mapTypeId: "hybrid", // PINDAHKAN KE SINI
        }}
      >
        {/* Marker, polyline, dll bisa ditaruh di sini */}
      </GoogleMap>
    </div>
  ) : (
    <p>Loading map...</p>
  )
}

export default GoogleMaps
