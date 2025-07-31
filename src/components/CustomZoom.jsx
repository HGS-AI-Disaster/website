import { useMap } from "react-leaflet"
import { Button } from "./ui/button"
import { Navigation2 } from "lucide-react"

export default function CustomZoom() {
  const map = useMap()

  const zoomIn = () => map.setZoom(map.getZoom() + 1)
  const zoomOut = () => map.setZoom(map.getZoom() - 1)

  return (
    <div className="absolute bottom-24 right-8 z-[999] flex flex-col gap-2 justify-end items-end">
      <Button
        onClick={zoomIn}
        className="cursor-pointer  bg-white hover:bg-gray-200 text-black font-bold"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-zoom-in"
          viewBox="0 0 16 16"
        >
          <path
            fill-rule="evenodd"
            d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"
          />
          <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z" />
          <path
            fill-rule="evenodd"
            d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"
          />
        </svg>
      </Button>
      <Button
        onClick={zoomOut}
        className=" cursor-pointer bg-white hover:bg-gray-200 text-black font-bold"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-zoom-out"
          viewBox="0 0 16 16"
        >
          <path
            fill-rule="evenodd"
            d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"
          />
          <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z" />
          <path
            fill-rule="evenodd"
            d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"
          />
        </svg>
      </Button>
      <Button
        className={
          "w-min cursor-pointer bg-gray-50 hover:bg-gray-200 text-black"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-record-circle"
          viewBox="0 0 16 16"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
        </svg>
      </Button>
      <Button
        className={
          "cursor-pointer bg-gray-50 hover:bg-gray-200 h-[45px] w-[50px]"
        }
      >
        <Navigation2
          fill="black"
          stroke="black"
          className="size-[25px]"
        />
      </Button>
    </div>
  )
}
