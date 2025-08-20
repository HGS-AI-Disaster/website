import LayerManagement from "@/components/LayerManagement"
import Map from "@/components/Map"
import Navbar from "@/components/Navbar"
import { supabase } from "@/supabase"
import React, { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setProfile, setToken, setUser } from "../../redux/reducers/auth"
import { toast } from "sonner"

function Home() {
  const auth = useSelector((state) => state.auth)

  const dispatch = useDispatch()

  useEffect(() => {
    // ambil session saat pertama kali load
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        dispatch(setToken(data.session.access_token))
        dispatch(setUser(data.session.user))
      }
    }
    getInitialSession()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          // user signed out atau token invalid
          dispatch(setToken(null))
          dispatch(setUser(null))
          dispatch(setProfile(null))
          return
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (session.access_token) {
          dispatch(setToken(session.access_token))
          dispatch(setUser(session.user))
          dispatch(setProfile(data))
          return
        }

        if (error) {
          console.error("Error fetching profile:", error)
          return
        }
      }
    )

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [dispatch])

  useEffect(() => {
    const authData = sessionStorage.getItem("auth")

    if (authData) {
      const parsed = JSON.parse(authData)

      if (parsed.status === "success") {
        toast.success(parsed.message, { duration: 10000 })
      } else if (parsed.status === "error") {
        toast.error(parsed.message, { duration: 10000 })
      }

      sessionStorage.removeItem("auth")
    }
  }, [])

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
