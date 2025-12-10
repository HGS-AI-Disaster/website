import React, { useEffect, useState } from "react"
import { FormLabel } from "./ui/form"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function RouteFormLabel({ id, label, disabled }) {
  const [desc, setDesc] = useState("")
  const [detail, setDetail] = useState("")

  useEffect(() => {
    if (id === "ai_recommended_route") {
      setDesc("Smart route based on real-time conditions.")
      setDetail(`Smart routes generated using Google Direction API, adjusted with real-time hazard zones and road conditions. This route is designed to minimize risk by automatically choosing the safest available paths, avoiding highly affected areas whenever possible. 
            Best for: real-time navigation and risk-aware travel.`)
    } else if (id === "official_emergency_route") {
      setDesc("Route based on verified evacuation road by local authority.")
      setDetail(`Official evacuation routes generated from MLIT (Ministry of Land, Infrastructure, Transport and Tourism of Japan) evacuation road data. Prioritizing wider and officially designated evacuation roads over narrow local streets.
Note: This route type is still under development and will be available soon.`)
    } else if (id === "official_emergency_road") {
      setDesc("Full evacuation road by local authority.")
      setDetail(
        `The official road network designated by MLIT Japan as evacuation routes across Chiba Prefecture. This data shows the core infrastructure used by authorities for large-scale evacuation planning.`
      )
    }
  }, [])

  return (
    <div className="mt-1">
      <FormLabel className={`text-sm font-semibold flex`}>
        <div
          className={`${
            id === "official_emergency_route" || disabled
              ? "text-muted-foreground"
              : ""
          }`}
        >
          {label}
        </div>
        {id === "walk" || id === "drive" ? (
          ""
        ) : (
          <Popover>
            <PopoverTrigger>
              <Info
                fill="grey"
                size={18}
                opacity={0.6}
                color="white"
                className="cursor-pointer"
              />
            </PopoverTrigger>
            <PopoverContent>
              <div className={`text-sm`}>{detail}</div>
            </PopoverContent>
          </Popover>
        )}
      </FormLabel>
      {desc.length ? (
        <p className="text-muted-foreground text-sm">{desc}</p>
      ) : (
        ""
      )}
    </div>
  )
}

export default RouteFormLabel
