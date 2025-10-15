import React, { useEffect, useRef, useState } from "react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { Autocomplete } from "@react-google-maps/api"
import AccordionLayer from "./AccordionLayer"
import { ArrowLeft, ArrowRight, Info, MapPinPlusInside } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useMapContext } from "@/context/MapContext"

function Navigation({
  setSearchResult,
  layers,
  currentLayer,
  setCurrentLayer,
}) {
  const [autocomplete, setAutocomplete] = useState(null)
  const [currentDate, setCurrentDate] = useState("")
  const [uniqueDates, setUniqueDates] = useState([])
  const { findNearby, evacuationType, setEvacuationType } = useMapContext()

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
        <div className="middle flex-5 flex justify-center mt-6">
          <div className="flex h-fit z-20 gap-1">
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
                className="-translate-x-1 text-sm w-80 border rounded-full bg-gray-50 px-4 py-2"
              />
            </Autocomplete>
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <div
                  className="rounded-full h-[38px] cursor-pointer bg-white w-[38px] flex justify-center items-center"
                  onClick={() => {
                    console.log({ evacuationType })
                    setEvacuationType({
                      point_type: "main",
                      mode: evacuationType.mode,
                    })
                    findNearby && findNearby("main")
                  }}
                >
                  <img
                    src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(1)%202.svg"
                    alt=""
                    srcset=""
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nearby Main Hospitals</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <div
                  className="rounded-full h-[38px] cursor-pointer bg-white w-[38px] flex justify-center items-center"
                  onClick={() => {
                    console.log({ evacuationType })
                    setEvacuationType({
                      point_type: "local",
                      mode: evacuationType.mode,
                    })
                    findNearby && findNearby("local")
                  }}
                >
                  <img
                    src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(2)%203.svg"
                    alt=""
                    srcset=""
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nearby Local Healthcares</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <div
                  className="rounded-full h-[38px] cursor-pointer bg-white w-[38px] flex justify-center items-center"
                  onClick={() => {
                    setEvacuationType({
                      point_type: "evacuation_point",
                      mode: evacuationType.mode,
                    })

                    findNearby && findNearby("evacuation_point")
                  }}
                >
                  <img
                    src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(4)%204.svg"
                    alt=""
                    srcset=""
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nearby Evacuation Points</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="legend flex-1 m-2 text-sm flex justify-end">
          <div className="bg-white shadow-md rounded-lg w-[160px] h-fit text-xs z-20">
            <div className="flex header px-3 pt-2 pb-1 items-center justify-between">
              <div className="font-semibold">Legend</div>
              <Dialog>
                <DialogTrigger>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="rounded-full cursor-pointer">
                        <Info
                          color="white"
                          fill="grey"
                          size={18}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View legend details</p>
                    </TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Legend Details</DialogTitle>
                    <DialogDescription>
                      See what each color and symbol means on the map.
                    </DialogDescription>
                    <Accordion
                      type="single"
                      collapsible
                    >
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Hazard Levels</AccordionTrigger>
                        <AccordionContent className="ps-4">
                          <div className="flex flex-col gap-2 w-full mt-3">
                            <div className="flex gap-4">
                              <div className="color-box color-box w-[1rem] h-[1rem] mt-1 bg-green-500"></div>
                              <div className="flex-1">
                                <div className="legend-title font-semibold">
                                  Low
                                </div>
                                <div className="legend-desc text-sm">
                                  Areas with minimal impact from disaster
                                  events. You can stay alert, but no immediate
                                  evacuation is required.
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 w-full mt-3">
                            <div className="flex gap-4">
                              <div className="color-box color-box w-[1rem] h-[1rem] mt-1 bg-yellow-500"></div>
                              <div className="flex-1">
                                <div className="legend-title font-semibold">
                                  Moderate
                                </div>
                                <div className="legend-desc text-sm">
                                  Areas with moderate impact. Be prepared to
                                  evacuate if the situation worsens.
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 w-full mt-3">
                            <div className="flex gap-4">
                              <div className="color-box color-box w-[1rem] h-[1rem] mt-1 bg-orange-500"></div>
                              <div className="flex-1">
                                <div className="legend-title font-semibold">
                                  High
                                </div>
                                <div className="legend-desc text-sm">
                                  Areas with high risk of flooding or severe
                                  damage. Evacuation is strongly advised once
                                  alerts are announced.
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 w-full mt-3">
                            <div className="flex gap-4">
                              <div className="color-box color-box w-[1rem] h-[1rem] mt-1 bg-red-500"></div>
                              <div className="flex-1">
                                <div className="legend-title font-semibold">
                                  Severe
                                </div>
                                <div className="legend-desc text-sm">
                                  Areas under severe impact or active disaster
                                  conditions. Avoid these zones and follow the
                                  evacuation route immediately.
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>
                          Evacuation and Health Facilities
                        </AccordionTrigger>
                        <AccordionContent className="ps-4">
                          <div className="flex flex-col gap-2 w-full mt-3">
                            <div className="flex gap-4">
                              <div className="rounded-full cursor-pointer  bg-white">
                                <img
                                  src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(4)%204.svg"
                                  alt=""
                                  srcset=""
                                />
                              </div>
                              <div className="flex-1">
                                <div className="legend-title font-semibold">
                                  Evacuation Point
                                </div>
                                <div className="legend-desc text-sm">
                                  Officially designated safe locations by local
                                  authorities for temporary evacuation and
                                  shelter.
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 w-full mt-3">
                            <div className="flex gap-4">
                              <div className="rounded-full cursor-pointer  bg-white">
                                <img
                                  src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(2)%203.svg"
                                  alt=""
                                  srcset=""
                                />
                              </div>
                              <div className="flex-1">
                                <div className="legend-title font-semibold">
                                  Local Healthcare
                                </div>
                                <div className="legend-desc text-sm">
                                  Nearby clinics or health posts that provide
                                  first aid and emergency care.
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 w-full mt-3">
                            <div className="flex gap-4">
                              <div className="rounded-full cursor-pointer  bg-white">
                                <img
                                  src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(1)%202.svg"
                                  alt=""
                                  srcset=""
                                />
                              </div>
                              <div className="flex-1">
                                <div className="legend-title font-semibold">
                                  Main Hospital
                                </div>
                                <div className="legend-desc text-sm">
                                  Major hospital facilities offering full
                                  emergency services and trauma treatment.
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <div className="legend-items pb-2">
              <div className="low px-3 py-1 flex items-center gap-3">
                <div className="w-[25px] h-[25px] flex justify-center items-center">
                  <div className="color-box w-[0.8rem] h-[0.8rem] bg-green-500"></div>
                </div>
                <div className="text">Low</div>
              </div>
              <div className="low px-3 py-1 flex items-center gap-3">
                <div className="w-[25px] h-[25px] flex justify-center items-center">
                  <div className="color-box w-[0.8rem] h-[0.8rem] bg-yellow-500"></div>
                </div>
                <div className="text">Moderate</div>
              </div>
              <div className="low px-3 py-1 flex items-center gap-3">
                <div className="w-[25px] h-[25px] flex justify-center items-center">
                  <div className="color-box w-[0.8rem] h-[0.8rem] bg-orange-500"></div>
                </div>
                <div className="text">High</div>
              </div>
              <div className="low px-3 py-1 flex items-center gap-3">
                <div className="w-[25px] h-[25px] flex justify-center items-center">
                  <div className="color-box w-[0.8rem] h-[0.8rem] bg-red-500"></div>
                </div>
                <div className="text">Severe</div>
              </div>
              <div className="low px-3 py-1 flex items-center gap-3">
                {/* <div className="color-box w-[0.8rem] h-[0.8rem] bg-red-500"></div> */}
                <div className="w-[25px]">
                  <img
                    src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(4)%204.svg"
                    alt=""
                    srcset=""
                  />
                </div>
                <div className="text">Evacuation Point</div>
              </div>
              <div className="low px-3 py-1 flex items-center gap-3">
                {/* <div className="color-box w-[0.8rem] h-[0.8rem] bg-red-500"></div> */}
                <div className="w-[25px]">
                  <img
                    src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(2)%203.svg"
                    alt=""
                    srcset=""
                  />
                </div>
                <div className="text">Local Healthcare</div>
              </div>
              <div className="low px-3 py-1 flex items-center gap-3">
                {/* <div className="color-box w-[0.8rem] h-[0.8rem] bg-red-500"></div> */}
                <div className="w-[25px]">
                  <img
                    src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/hospital%20(1)%202.svg"
                    alt=""
                    srcset=""
                  />
                </div>
                <div className="text">Main Hospital</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="buttom flex-1 flex flex-col justify-end">
        <div className="time-series flex mb-6 flex-col items-center z-20">
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
                          <div className={"mb-1 text-center text-xs"}>
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
