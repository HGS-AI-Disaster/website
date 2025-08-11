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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"

function Navigation({ layers, currentLayer, setCurrentLayer }) {
  const [currentDate, setCurrentDate] = useState("")
  const uniqueDates = [...new Set(layers.map((layer) => layer.layerDate))]

  useEffect(() => {
    setCurrentDate(currentLayer.layerDate)
  }, [])

  return (
    <div className="navigations flex-1 flex flex-col h-full">
      <div className="top w-full flex flex-1 justify-between">
        <div className="layers relative flex-1 m-8 z-20">
          <Accordion
            type="single"
            collapsible
            className="w-full absolute shadow-md rounded-lg bg-gray-50"
            defaultValue="item-1"
          >
            {layers
              .filter((layer) => layer.layerDate === currentDate)
              .some((layer) => layer.category === "Cloud Layer") && (
              <AccordionItem value="item-1">
                <AccordionTrigger className="px-2">
                  Cloud Layer
                </AccordionTrigger>
                <AccordionContent className="flex flex-col text-balance">
                  {layers
                    .filter(
                      (layer) =>
                        layer.category === "Cloud Layer" &&
                        layer.layerDate === currentDate
                    )
                    .map((layer, index) => (
                      <a
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentLayer(layer)
                          console.log(layer.layer)
                        }}
                        className="cursor-default"
                      >
                        <div className="text px-2 py-2 hover:bg-gray-100">
                          {layer.layer}
                        </div>
                      </a>
                    ))}
                </AccordionContent>
              </AccordionItem>
            )}
            {layers
              .filter((layer) => layer.layerDate === currentDate)
              .some((layer) => layer.category === "Disaster Layer") && (
              <AccordionItem value="item-2">
                <AccordionTrigger className="px-2">
                  Disaster Prediction
                </AccordionTrigger>
                <AccordionContent className="flex flex-col text-balance">
                  {layers
                    .filter(
                      (layer) =>
                        layer.category === "Disaster Layer" &&
                        layer.layerDate === currentDate
                    )
                    .map((layer, index) => (
                      <a
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentLayer(layer)
                          console.log(layer.layer)
                        }}
                        className="cursor-default"
                      >
                        <div className="text px-2 py-2 hover:bg-gray-100">
                          {layer.layer}
                        </div>
                      </a>
                    ))}
                </AccordionContent>
              </AccordionItem>
            )}
            {layers
              .filter((layer) => layer.layerDate === currentDate)
              .some((layer) => layer.category === "Chiba University") && (
              <AccordionItem value="item-3">
                <AccordionTrigger className="px-2">
                  Chiba University
                </AccordionTrigger>
                <AccordionContent className="flex flex-col text-balance">
                  {layers
                    .filter(
                      (layer) =>
                        layer.category === "Chiba University" &&
                        layer.layerDate === currentDate
                    )
                    .map((layer, index) => (
                      <a
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentLayer(layer)
                          console.log(layer.layer)
                        }}
                        className="cursor-default"
                      >
                        <div className="text px-2 py-2 hover:bg-gray-100">
                          {layer.layer}
                        </div>
                      </a>
                    ))}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
        <div className="search-bar flex-5 flex justify-center m-8">
          <Input
            type="text"
            className={"rounded-full w-2/5 z-20 bg-gray-50 px-6 py-5"}
            placeholder="Search places..."
          />
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
          <NavigationMenu className={"bg-gray-50 h-fit px-1 py-1 rounded-lg"}>
            <NavigationMenuList className={"gap-1"}>
              {uniqueDates.map((date) => {
                const sampleLayer = layers.find(
                  (layer) => layer.layerDate === date
                )

                return (
                  <NavigationMenuItem key={date}>
                    <NavigationMenuLink
                      onClick={() => {
                        setCurrentDate(sampleLayer.layerDate)
                        setCurrentLayer(sampleLayer)
                      }}
                      className={`cursor-pointer px-4 bg-gray-50 hover:bg-gray-200 ${
                        date === currentDate ? "font-bold" : "font-normal"
                      }`}
                    >
                      {new Date(date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </div>
  )
}

export default Navigation
