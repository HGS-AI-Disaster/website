import React, { useEffect, useRef, useState } from "react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { Autocomplete } from "@react-google-maps/api"
import AccordionLayer from "./AccordionLayer"
import { ArrowLeft, ArrowRight } from "lucide-react"

function Navigation({
  setSearchResult,
  layers,
  currentLayer,
  setCurrentLayer,
}) {
  const [autocomplete, setAutocomplete] = useState(null)
  const [currentDate, setCurrentDate] = useState("")
  const [uniqueDates, setUniqueDates] = useState([])

  // ref untuk container yang bisa discroll
  const scrollContainerRef = useRef(null)

  // buat nge-set time series scrolling ke paling kanan
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth
    }
  }, [uniqueDates]) // supaya kalau uniqueDates berubah juga langsung ke kanan

  const onLoad = (ac) => setAutocomplete(ac)

  const onPlaceChanged = () => {
    if (autocomplete) {
      console.log("Pencarian ketemu")
      const place = autocomplete.getPlace()
      if (place.geometry) {
        const location = place.geometry.location
        const pos = {
          lat: location.lat(),
          lng: location.lng(),
        }
        setSearchResult(pos) // kirim ke parent
      }
    }
  }

  useEffect(() => {
    if (layers.length) {
      const validLayers = layers.filter((l) => l.file_url)
      const visibleLayers = validLayers.filter((l) => l.visibility === "public")

      setUniqueDates([
        ...new Set(visibleLayers.map((layer) => layer.layer_date)),
      ])

      const findCurrentDate = layers.find((l) => l.visibility === "public")

      if (findCurrentDate) {
        setCurrentDate(findCurrentDate.layer_date)
      }
    }
  }, [layers])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -100, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 100, behavior: "smooth" })
    }
  }

  return (
    <div className="navigations h-full flex flex-col">
      <div className="top w-full flex flex-1 justify-between">
        <AccordionLayer
          layers={layers}
          currentLayer={currentLayer}
          setCurrentLayer={setCurrentLayer}
          currentDate={currentDate}
        />
        <div className="search-bar flex-5 flex justify-center m-8">
          <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              onBlur={(input) => {
                if (!input.target.value) {
                  setSearchResult(null)
                }
                input.target.value
              }}
              placeholder="Search places..."
              className="-translate-x-1 text-sm w-80 border rounded-full z-20 bg-gray-50 px-6 py-3"
            />
          </Autocomplete>
        </div>
        <div className="legend flex-1 m-8 text-sm flex justify-end">
          <div className="bg-white shadow-md rounded-lg w-fit h-fit z-20">
            <div className="header px-4 pt-2 pb-1 font-semibold">Legend</div>
            <div className="legend-items pb-2">
              <div className="low px-4 py-2 flex items-center gap-3">
                <div className="color-box w-[0.8rem] h-[0.8rem] bg-green-500"></div>
                <div className="text">Low</div>
              </div>
              <div className="low px-4 py-2 flex items-center gap-3">
                <div className="color-box w-[0.8rem] h-[0.8rem] bg-yellow-500"></div>
                <div className="text">Moderate</div>
              </div>
              <div className="low px-4 py-2 flex items-center gap-3">
                <div className="color-box w-[0.8rem] h-[0.8rem] bg-orange-500"></div>
                <div className="text">High</div>
              </div>
              <div className="low px-4 py-2 flex items-center gap-3">
                <div className="color-box w-[0.8rem] h-[0.8rem] bg-red-500"></div>
                <div className="text">Severe</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="buttom flex-1 flex flex-col justify-end">
        <div className="time-series flex mb-8 flex-col items-center z-20">
          {uniqueDates.length ? (
            <div
              className={
                "bg-gray-50 h-fit items-center flex px-2 relative rounded-lg"
              }
            >
              {uniqueDates.length > 6 && (
                <div
                  className="me-2 cursor-pointer"
                  onClick={scrollLeft}
                >
                  <ArrowLeft size={18} />
                </div>
              )}
              <div
                ref={scrollContainerRef}
                className="flex gap-2 overflow-x-auto scrollbar-none w-full max-w-[550px]"
              >
                <NavigationMenu className={`flex gap-2`}>
                  {uniqueDates.sort().map((date) => {
                    const sampleLayer = layers.find(
                      (layer) => layer.layer_date === date
                    )
                    return (
                      <NavigationMenuItem
                        key={date}
                        className={"list-none"}
                      >
                        <NavigationMenuLink
                          onClick={() => {
                            setCurrentDate(sampleLayer.layer_date)
                            setCurrentLayer(sampleLayer)
                          }}
                          className={`cursor-pointer w-[85px] pt-[12px] px-4 bg-gray-50 hover:bg-gray-50 relative`}
                        >
                          <div className={"mb-1 text-center"}>
                            {new Date(date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                          {date === currentDate && (
                            <div className="h-[6px] w-full absolute bottom-0 left-0 bg-slate-600"></div>
                          )}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      // </DropdownMenu>
                    )
                  })}
                </NavigationMenu>
              </div>
              {uniqueDates.length > 6 && (
                <div
                  className="ms-2 cursor-pointer"
                  onClick={scrollRight}
                >
                  <ArrowRight size={18} />
                </div>
              )}
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  )
}

export default Navigation
