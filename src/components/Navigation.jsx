import React, { useEffect, useState } from "react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Badge } from "./ui/badge"
import { Autocomplete } from "@react-google-maps/api"

function Navigation({
  setSearchResult,
  layers,
  currentLayer,
  setCurrentLayer,
}) {
  const [autocomplete, setAutocomplete] = useState(null)
  const [currentDate, setCurrentDate] = useState("")
  const uniqueDates = [...new Set(layers.map((layer) => layer.layer_date))]

  const onLoad = (ac) => setAutocomplete(ac)

  const onPlaceChanged = () => {
    if (autocomplete) {
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
    if (layers.length && !currentDate) {
      setCurrentDate(layers[0].layer_date)
      setCurrentLayer(layers[0])
    }
  }, [layers, currentDate, setCurrentLayer])

  return (
    <div className="navigations h-full flex flex-col">
      <div className="top w-full flex flex-1 justify-between">
        {layers.length ? (
          <div className="layers relative flex-1 m-8 z-20">
            <Accordion
              type="single"
              collapsible
              className="w-full absolute shadow-md rounded-lg bg-gray-50"
              defaultValue="item-1"
            >
              {layers
                .filter((layer) => layer.layer_date === currentDate)
                .some((layer) => layer.category === "Cloud Layer") && (
                <AccordionItem value="item-1">
                  <AccordionTrigger className="px-2">
                    Cloud Layer
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col text-balance max-h-50 overflow-y-auto">
                    {layers
                      .filter(
                        (layer) =>
                          layer.category === "Cloud Layer" &&
                          layer.layer_date === currentDate
                      )
                      .map((layer, index) => (
                        <a
                          key={index}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentLayer(layer)
                          }}
                          className="cursor-default"
                        >
                          <div className="text px-2 py-2 flex gap-3 items-center hover:bg-gray-100">
                            <div className="flex-1 truncate">{layer.layer}</div>
                            {currentLayer.layer === layer.layer && (
                              <Badge
                                variant={"secondary"}
                                className={
                                  "text-[10.5px] bg-blue-500 text-white"
                                }
                              >
                                active
                              </Badge>
                            )}
                          </div>
                        </a>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              )}
              {layers
                .filter((layer) => layer.layer_date === currentDate)
                .some((layer) => layer.category === "Disaster Layer") && (
                <AccordionItem value="item-2">
                  <AccordionTrigger className="px-2">
                    Disaster Prediction
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col text-balance max-h-50 overflow-y-auto">
                    {layers
                      .filter(
                        (layer) =>
                          layer.category === "Disaster Layer" &&
                          layer.layer_date === currentDate
                      )
                      .map((layer, index) => (
                        <a
                          key={index}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentLayer(layer)
                          }}
                          className="cursor-default"
                        >
                          <div className="text px-2 py-2 hover:bg-gray-100 flex gap-3 items-center">
                            <div className="flex-1 truncate">{layer.layer}</div>
                            {currentLayer.layer === layer.layer && (
                              <Badge
                                variant={"secondary"}
                                className={
                                  "text-[10.5px] bg-blue-500 text-white"
                                }
                              >
                                active
                              </Badge>
                            )}
                          </div>
                        </a>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              )}
              {layers
                .filter((layer) => layer.layer_date === currentDate)
                .some((layer) => layer.category === "Chiba University") && (
                <AccordionItem value="item-3">
                  <AccordionTrigger className="px-2">
                    Chiba University
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col text-balance max-h-50 overflow-y-auto">
                    {layers
                      .filter(
                        (layer) =>
                          layer.category === "Chiba University" &&
                          layer.layer_date === currentDate
                      )
                      .map((layer, index) => (
                        <a
                          key={index}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentLayer(layer)
                          }}
                          className="cursor-default"
                        >
                          <div className="text px-2 py-2 flex gap-3 items-center hover:bg-gray-100">
                            <div className="flex-1 truncate">{layer.layer}</div>
                            {currentLayer.layer === layer.layer && (
                              <Badge
                                variant={"secondary"}
                                className={
                                  "text-[10.5px] bg-blue-500 text-white"
                                }
                              >
                                active
                              </Badge>
                            )}
                          </div>
                        </a>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        ) : (
          <div className="flex-1 m-8 -z-20"></div>
        )}
        <div className="search-bar flex-5 flex justify-center m-8">
          {/* <Input
            type="text"
            className={"rounded-full w-2/5 z-20 bg-gray-50 px-6 py-5"}
            placeholder="Search places..."
          /> */}
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
            <div className={"bg-gray-50 h-fit px-4 pt-[6px] rounded-lg"}>
              <NavigationMenu className={"flex gap-2"}>
                {uniqueDates.sort().map((date) => {
                  const sampleLayer = layers.find(
                    (layer) => layer.layer_date === date
                  )
                  return (
                    // <DropdownMenu key={date}>
                    //   <DropdownMenuTrigger
                    //     onClick={() => {
                    //       setCurrentDate(sampleLayer.layer_date)
                    //       setCurrentLayer(sampleLayer)
                    //     }}
                    //     className={`cursor-pointer relative`}
                    //   >
                    //     <div className="mb-[6px] bg-gray-50 px-4 py-1 text-sm hover:bg-gray-200 w-full">
                    //       {new Date(date).toLocaleDateString("en-GB", {
                    //         day: "2-digit",
                    //         month: "short",
                    //       })}
                    //     </div>
                    //     {date === currentDate && (
                    //       <div className="h-[6px] w-full absolute bottom-0 left-0 bg-slate-600"></div>
                    //     )}
                    //   </DropdownMenuTrigger>
                    //   <DropdownMenuContent className={"mb-2"}>
                    //     <DropdownMenuItem>Gempa 1, 12.00</DropdownMenuItem>
                    //     <DropdownMenuItem>Gempa 2, 15.00</DropdownMenuItem>
                    //     <DropdownMenuItem>Gempa 3, 17.00</DropdownMenuItem>
                    //   </DropdownMenuContent>
                    <NavigationMenuItem
                      key={date}
                      className={"list-none"}
                    >
                      <NavigationMenuLink
                        onClick={() => {
                          setCurrentDate(sampleLayer.layer_date)
                          setCurrentLayer(sampleLayer)
                        }}
                        className={`cursor-pointer px-4 bg-gray-50 hover:bg-gray-50 relative`}
                      >
                        <div className={"mb-1"}>
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
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  )
}

export default Navigation
