import React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { Badge } from "./ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function AccordionLayer({
  layers,
  currentLayer,
  setCurrentLayer,
  currentDate,
}) {
  // filter sesuai tanggal
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
    "Rainfall",
    "Earthquake",
    "Flood",
    "Chiba University",
  ]

  return filteredLayers.length ? (
    <div className="layers relative flex-1 m-2 z-20">
      <Accordion
        type="single"
        collapsible
        className="w-[200px] absolute shadow-md rounded-lg bg-gray-50"
      >
        {/* loop untuk source */}
        {Object.entries(groupedBySource).map(
          ([sourceName, sourceLayers]) =>
            sourceLayers.length > 0 && (
              <AccordionItem
                key={sourceName}
                value={sourceName}
              >
                <AccordionTrigger className="px-2 capitalize font-bold text-xs">
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
                          className="border-0"
                        >
                          <AccordionTrigger className="pe-2 text-xs ps-5 pt-1 pb-1 font-semibold">
                            {cat}
                          </AccordionTrigger>
                          <AccordionContent className="text-xs flex pb-0 flex-col max-h-50 overflow-y-auto w-full">
                            {catLayers.map((layer, index) => {
                              const isoString = layer.created_at
                              const date = new Date(isoString)

                              const timeString = date.toLocaleTimeString(
                                "en-US",
                                {
                                  timeZone: "Asia/Tokyo",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )

                              return (
                                <Tooltip
                                  key={index}
                                  delayDuration={400}
                                  skipDelayDuration={500}
                                >
                                  <TooltipTrigger
                                    onClick={() => {
                                      setCurrentLayer(layer)
                                    }}
                                    className="cursor-default"
                                  >
                                    <div
                                      className={`text px-2 py-2 flex gap-3 items-center w-full ${
                                        currentLayer?.id === layer.id
                                          ? ""
                                          : "hover:bg-gray-100"
                                      }`}
                                    >
                                      <div
                                        className={`text-left ps-8 truncate w-full ${
                                          currentLayer?.id === layer.id
                                            ? "text-gray-600"
                                            : "text-black"
                                        }`}
                                      >
                                        {layer.layer}
                                      </div>

                                      <Badge
                                        variant={"outline"}
                                        className="text-[10px] text-gray-500 px-1"
                                      >
                                        {timeString}
                                      </Badge>
                                    </div>
                                  </TooltipTrigger>

                                  <TooltipContent>
                                    <p>
                                      {layer.layer}{" "}
                                      {currentLayer?.id === layer.id &&
                                        "(active)"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            })}
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
