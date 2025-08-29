import AuthCallback from "@/pages/AuthCallback.jsx"
import Home from "@/pages/Home.jsx"
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
