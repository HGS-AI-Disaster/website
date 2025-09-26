import { OverlayView } from "@react-google-maps/api"

export default function CustomPopup({ position, text, title, width = 235 }) {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      {/* elemen pertama di dalam OverlayView HARUS punya width */}
      <div
        className="bg-white rounded-lg px-3 py-2 shadow-md"
        style={{ width: `${width}px`, maxWidth: `${width}px` }}
      >
        {title && <div className="font-semibold text-sm mb-1">{title}</div>}
        <div className="text-xs leading-snug break-words">{text}</div>
      </div>
    </OverlayView>
  )
}
