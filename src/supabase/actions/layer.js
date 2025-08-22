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
  const { error: addLayerError } = await supabase.from("layers").insert([
    {
      layer,
      category,
      layer_date: date,
      source,
      visibility,
      description,
      file_url: publicUrl, // ambil `publicUrl`
    },
  ])

  if (addLayerError) throw addLayerError
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

    //   Cannot destructure property 'layer' of 'data' as it is undefined.

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

  console.log(id)

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
