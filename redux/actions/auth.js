import axios from "axios"
import { toast } from "sonner"
import { setToken, setUser, setProfile } from "../reducers/auth"

export const login = (email, password) => async (dispatch) => {
  let data = JSON.stringify({
    email,
    password,
  })

  let config = {
    method: "post",
    url: `${import.meta.env.VITE_BACKEND_API}/auth/login`,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  }

  try {
    const response = await axios.request(config)

    // get and save the token to local storage
    const { data, profile } = response.data
    const { user, session } = data

    // Change the token value in the reducer
    dispatch(setToken(session.access_token))
    dispatch(setUser(user))
    dispatch(setProfile(profile))

    toast.success("Login success")
  } catch (error) {
    console.error(error)
    toast.error(error?.response?.data?.message)
  }
}

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

      console.log(result)

      // Update Redux kalau berhasil
      dispatch(setProfile(result.data.profile[0]))
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
