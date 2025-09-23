import { useEffect, useRef } from "react"

export default function AdvancedMarker({
  map,
  position,
  title,
  icon,
  onClick,
  children,
}) {
  const markerRef = useRef(null)

  useEffect(() => {
    if (!map || !position) return

    // cleanup marker lama
    if (markerRef.current) {
      markerRef.current.map = null
    }

    const { AdvancedMarkerElement } = google.maps.marker

    // kalau ada custom content (misalnya icon HTML/emoji)
    let content = null
    if (children) {
      content = document.createElement("div")
      content.style.display = "flex"
      content.style.alignItems = "center"
      content.style.justifyContent = "center"
      content.innerHTML = children
    }

    const marker = new AdvancedMarkerElement({
      map,
      position,
      title,
      content,
    })

    if (onClick) {
      marker.addListener("gmp-click", onClick) // beda event: `gmp-click`
    }

    markerRef.current = marker

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null
      }
    }
  }, [map, position, title, icon, children, onClick])

  return null
}
