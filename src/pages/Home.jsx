import LayerManagement from "@/components/LayerManagement"
import Map from "@/components/Map"
import Navbar from "@/components/Navbar"
import { supabase } from "@/supabase"
import React, { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setProfile, setToken, setUser } from "../../redux/reducers/auth"
import {
  fetchLayers,
  addLayer,
  updateLayer,
  deleteLayer,
} from "../../redux/reducers/layers"
import { toast } from "sonner"

function Home() {
  const auth = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  useEffect(() => {
    // 1. Cek session pertama kali
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session?.user) {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.session?.user.id)
          .single()
        if (error) throw error

        dispatch(setProfile(profileData))
      }

      dispatch(setUser(data.session?.user || null))
    }

    getSession()

    // 2. Listen kalau ada perubahan login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setUser(session?.user || null))
    })

    return () => subscription.unsubscribe()
  }, [])

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

  useEffect(() => {
    dispatch(fetchLayers())
    const channel = supabase
      .channel("layers-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "layers" },
        (payload) => {
          console.log("Realtime event:", payload)
          if (payload.eventType === "INSERT") {
            dispatch(addLayer(payload.new))
          } else if (payload.eventType === "UPDATE") {
            dispatch(updateLayer(payload.new))
          } else if (payload.eventType === "DELETE") {
            dispatch(deleteLayer(payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log("Channel status:", status) // <- status: SUBSCRIBED, TIMED_OUT, CLOSED
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div>
      <div className="h-screen flex flex-col">
        <Navbar />
        <Map />
      </div>
      {auth.user && <LayerManagement />}
    </div>
  )
}

export default Home
