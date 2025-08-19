import "./index.css"

import { useEffect, useState } from "react"
import LayerManagement from "./components/LayerManagement"

import GoogleMaps from "./components/GoogleMaps"
import Map from "./components/Map"
import Navbar from "./components/Navbar"
import { Provider, useSelector } from "react-redux"
import { Toaster } from "sonner"
import { RouterProvider } from "react-router-dom"
import store from "../redux/store"
import router from "./routes"

function App({ children }) {
  return (
    <Provider store={store}>
      <Toaster
        richColors
        position="top-center"
      />
      <RouterProvider router={router}>{children}</RouterProvider>
    </Provider>
  )
}

export default App
