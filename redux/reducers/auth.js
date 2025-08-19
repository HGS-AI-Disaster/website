import { createSlice } from "@reduxjs/toolkit"

// Define the initial state
const initialState = {
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user")) || null,
  profile: JSON.parse(localStorage.getItem("profile")) || null,
}

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action) => {
      if (action.payload) {
        localStorage.setItem("token", action.payload)
      } else {
        localStorage.removeItem("token")
      }

      state.token = action.payload
    },
    setUser: (state, action) => {
      if (action.payload) {
        state.user = action.payload
        localStorage.setItem("user", JSON.stringify(action.payload))
      } else {
        state.user = null
        localStorage.removeItem("user")
      }
    },
    setProfile: (state, action) => {
      if (action.payload) {
        state.profile = action.payload
        localStorage.setItem("profile", JSON.stringify(action.payload))
      } else {
        state.profile = null
        localStorage.removeItem("profile")
      }
    },
  },
})

export const { setToken, setUser, setProfile } = authSlice.actions
export default authSlice.reducer
