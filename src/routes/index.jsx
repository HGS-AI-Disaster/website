import AuthCallback from "@/pages/AuthCallback"
import Home from "../pages/Home"
import { createBrowserRouter } from "react-router-dom"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
])

export default router
