import LayerManagement from "@/components/LayerManagement"
import Map from "@/components/Map"
import Navbar from "@/components/Navbar"
import React from "react"
import { useSelector } from "react-redux"

function Home() {
  const auth = useSelector((state) => state.auth)

  return (
    <div>
      <div className="h-screen flex flex-col">
        <Navbar />
        <Map />
      </div>
      {auth.token && <LayerManagement />}
    </div>
  )
}

export default Home
