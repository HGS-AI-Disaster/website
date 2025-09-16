import React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { Badge } from "./ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function AccordionLayer({
  layers,
  currentLayer,
  setCurrentLayer,
  currentDate,
}) {
  // filter sesuai tanggal
  console.log("layers", layers)
  console.log("currentDate", currentDate)
  const filteredLayers = layers.filter(
    (l) => l.visibility === "public" && l.layer_date === currentDate
  )

  // kelompokkan berdasarkan source
  const groupedBySource = {
    admin: filteredLayers.filter((l) => l.source === "admin"),
    prediction: filteredLayers.filter((l) => l.source === "prediction"),
  }

  // daftar kategori yang mungkin muncul
  const categories = [
    "Cloud",
    "Typhoon",
    "Heavy Rain",
    "Earthquake",
    "Flood",
    "Chiba University",
  ]

  return filteredLayers.length ? (
    <div className="layers relative flex-1 m-8 z-20">
      <Accordion
        type="single"
        collapsible
        className="min-w-[169.66px] absolute shadow-md rounded-lg bg-gray-50"
      >
        {/* loop untuk source */}
        {Object.entries(groupedBySource).map(
          ([sourceName, sourceLayers]) =>
            sourceLayers.length > 0 && (
              <AccordionItem
                key={sourceName}
                value={sourceName}
              >
                <AccordionTrigger className="px-2 capitalize font-bold">
                  {sourceName} {/* Admin / Prediction */}
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                  >
                    {categories.map((cat) => {
                      const catLayers = sourceLayers.filter(
                        (l) => l.category === cat
                      )
                      return catLayers.length > 0 ? (
                        <AccordionItem
                          key={`${sourceName}-${cat}`}
                          value={`${sourceName}-${cat}`}
                        >
                          <AccordionTrigger className="pe-2 ps-5 pt-0 pb-1 font-semibold">
                            {cat}
                          </AccordionTrigger>
                          <AccordionContent className="flex pb-0 flex-col max-h-50 overflow-y-auto w-full">
                            {catLayers.map((layer, index) => (
                              <a
                                key={index}
                                onClick={(e) => {
                                  e.preventDefault()
                                  setCurrentLayer(layer)
                                }}
                                className="cursor-default"
                              >
                                <div className="text px-2 py-2 flex gap-3 items-center hover:bg-gray-100 w-full">
                                  <div className="flex-1 truncate ps-6 w-full">
                                    {layer.layer}
                                  </div>
                                  {currentLayer?.layer === layer.layer && (
                                    <Badge
                                      variant={"outline"}
                                      className="text-[10px] text-gray-500 px-1"
                                    >
                                      active
                                    </Badge>
                                  )}
                                </div>
                              </a>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      ) : null
                    })}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            )
        )}
      </Accordion>
    </div>
  ) : (
    <div className="flex-1 m-8 -z-20"></div>
  )
}

export default AccordionLayer
