import { supabase } from "../index"
import { toast } from "sonner"

export const getLayers = async () => {
  try {
    const { data, error: layerError } = await supabase
      .from("layers")
      .select("*")

    if (layerError) throw new Error(layerError.message)
    return data
  } catch (error) {
    throw error
  }
}

export const getPublicLayers = async () => {
  try {
    const { data, error } = await supabase
      .from("layers")
      .select("*")
      .eq("visibility", "public")

    if (error) throw new Error(error.message)
    return data
  } catch (error) {
    throw error
  }
}

export const addLayer = async (data) => {
  const { layer, category, date, source, visibility, description, file } = data
  const layerFile = file // pastikan array kalau react-hook-form
  const fileExt = layerFile.name.split(".").pop()
  const filePath = `layers/${Date.now()}.${fileExt}`

  // Upload file ke storage
  const { error: uploadError } = await supabase.storage
    .from("layers")
    .upload(filePath, layerFile, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) throw uploadError

  // Dapatkan public URL
  const { data: publicUrl } = supabase.storage
    .from("layers")
    .getPublicUrl(filePath)

  // Insert ke tabel `layers`
  const { data: addLayerData, error: addLayerError } = await supabase
    .from("layers")
    .insert([
      {
        layer,
        category,
        layer_date: date,
        source,
        visibility,
        description,
        file_url: publicUrl.publicUrl, // ambil `publicUrl`
      },
    ])
    .select("*")
    .single()

  if (addLayerError) throw addLayerError

  console.log(addLayerData)

  return addLayerData
}

export const editLayer = async ({ id, data }) => {
  const { name, category, date, source, visibility, description, file } = data

  if (file) {
    const layerFile = file // pastikan array kalau react-hook-form
    const fileExt = layerFile.name.split(".").pop()
    const filePath = `layers/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("layers")
      .upload(filePath, layerFile, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: publicUrl } = supabase.storage
      .from("layers")
      .getPublicUrl(filePath)

    const { error } = await supabase
      .from("layers")
      .update({
        file_url: publicUrl.publicUrl,
      })
      .eq("id", id)

    if (error) {
      throw error
    }
  }

  const { error } = await supabase
    .from("layers")
    .update({
      layer: name,
      category,
      layer_date: date,
      source,
      visibility,
      description,
    })
    .eq("id", id)
    .select()

  if (error) {
    throw error
  }
}

export const editVisibility = async (id) => {
  const { data: selectedLayer, error: selectedError } = await supabase
    .from("layers")
    .select("*")
    .eq("id", id)
    .single()

  if (selectedError) throw selectedError

  const { error } = await supabase
    .from("layers")
    .update({
      visibility: selectedLayer.visibility === "public" ? "private" : "public",
    })
    .eq("id", id)
    .select()

  if (error) throw error
}

export const deleteLayer = async (id) => {
  const { error } = await supabase.from("layers").delete().eq("id", id).select()

  if (error) throw error
}
