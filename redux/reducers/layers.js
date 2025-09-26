import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { supabase } from "@/supabase/index"
import { toast } from "sonner"

// Async thunk untuk fetch awal
export const fetchLayers = createAsyncThunk("layers/fetchLayers", async () => {
  const { data, error } = await supabase
    .from("layers")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) {
    toast.error(
      `Failed to get layers. Please check your internet connection.`,
      {
        duration: 15000,
        id: "error-fetch-layer",
      }
    )
    throw error
  }
  return data
})

const layersSlice = createSlice({
  name: "layers",
  initialState: {
    data: [],
    status: "idle",
    error: null,
  },
  reducers: {
    addLayer: (state, action) => {
      state.data.unshift(action.payload)
    },
    updateLayer: (state, action) => {
      const index = state.data.findIndex((l) => l.id === action.payload.id)
      if (index !== -1) state.data[index] = action.payload
    },
    deleteLayer: (state, action) => {
      state.data = state.data.filter((l) => l.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLayers.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchLayers.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.data = action.payload
      })
      .addCase(fetchLayers.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message
      })
  },
})

export const { addLayer, updateLayer, deleteLayer } = layersSlice.actions
export default layersSlice.reducer
