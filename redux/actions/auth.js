import axios from "axios"
import { toast } from "sonner"
import { setToken, setUser, setProfile } from "../reducers/auth"
import { supabase } from "@/supabase"

// export const login = (email, password) => async (dispatch) => {
//   try {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     })

//     if (error) throw error

//     const { user, session } = data

//     // ambil profile user (kalau kamu pakai table profiles)
//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("*")
//       .eq("id", user.id)
//       .single()

//     if (profileError) throw profileError

//     // update Redux state (ga perlu setItem localStorage lagi)
//     dispatch(setUser(user))
//     dispatch(setProfile(profile))

//     toast.success("Login success")
//   } catch (err) {
//     console.error("Login error:", err)
//     toast.error(err.message || "Login failed")
//   }
// }

// export const login = (email, password) => {

// }

// export const changePassword = (newPassword) => async (dispatch) => {
//   try {
//     const { data, error } = await supabase.auth.updateUser({
//       password: newPassword,
//     })

//     if (error) throw error

//     toast.success("Password updated successfully")
//     return data
//   } catch (err) {
//     console.error("Update password error:", err)
//     toast.error(err.message || "Failed to update password")
//   }
// }

export const updateProfile = (values) => async (dispatch, getState) => {
  const state = getState()
  const currentUser = state.auth.user
  const currentProfile = state.auth.profile

  // Bandingin dengan data lama
  if (
    values.username !== currentProfile.username ||
    values.email !== currentUser.email ||
    values.role !== currentProfile.role
  ) {
    const myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")

    const raw = JSON.stringify({
      username: values.username,
      email: values.email,
      role: values.role,
    })

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/update-profile",
        requestOptions
      )
      const result = await response.json()

      // Update Redux kalau berhasil
      dispatch(setProfile(result.data.profile))
      dispatch(setUser(result.data.email))

      toast.success("Profile updated")
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || "Failed to update profile")
    }
  }

  if (values.password || values.confirmPassword) {
    const myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")

    const raw = JSON.stringify({
      password: values.password,
      confirmPassword: values.confirmPassword,
    })

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    }

    fetch(
      `http://localhost:3000/api/auth/change-password/${data.user.id}`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        console.log(result)
        toast.success("Password updated")
      })
      .catch((error) => toast.error(error?.response?.data?.message))
      .finally()
  }
}

export const logout = () => async (dispatch) => {
  const raw = ""

  const requestOptions = {
    method: "POST",
    body: raw,
    redirect: "follow",
  }

  fetch("http://localhost:3000/api/auth/logout", requestOptions)
    .then((response) => response.text())
    .then((result) => {
      dispatch(setToken(null))
      dispatch(setUser(null))
      dispatch(setProfile(null))
      toast.success("Logout success")
    })
    .catch((error) => {
      console.error(error)
      toast.error("Logout failed")
    })
}
