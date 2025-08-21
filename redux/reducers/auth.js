import { createSlice } from "@reduxjs/toolkit"

// Define the initial state
const initialState = {
  user: null,
  profile: null,
}

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
    },
    setProfile: (state, action) => {
      state.profile = action.payload
    },
  },
})

export const { setToken, setUser, setProfile } = authSlice.actions
export default authSlice.reducer
