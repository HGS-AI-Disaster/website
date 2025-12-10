import { supabase } from "../index"
import { toast } from "sonner"

export const getLayers = async () => {
  try {
    const { data, error: layerError } = await supabase
      .from("layers")
      .select("*", { count: "exact" })
      .range(0, 5000) //semua layer

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
      .select("*", { count: "exact" })
      .eq("visibility", "public")
      .range(0, 5000) //semua layer

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
  const filePath = `${Date.now()}.${fileExt}`

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

  if (addLayerData) {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_PRECOMPUTE_URL}/precompute-shelters`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          layerId: addLayerData.id, // ID dari tabel layers setelah insert
          fileUrl: addLayerData.file_url,
        }),
      }
    )
  }

  if (addLayerError) throw addLayerError

  return addLayerData
}

export const editLayer = async ({ id, data }) => {
  const { name, category, date, source, visibility, description, file } = data

  const { data: updatedData, error } = await supabase
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
    .single()

  if (error) {
    throw error
  }

  if (file) {
    const oldFile = updatedData.file_url.split("/").pop()

    const { error: deleteError } = await supabase.storage
      .from("layers")
      .remove([oldFile])

    if (deleteError) {
      throw deleteError
    }

    const layerFile = file // pastikan array kalau react-hook-form
    const fileExt = layerFile.name.split(".").pop()
    const filePath = `${Date.now()}.${fileExt}`

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
  const { data, error } = await supabase
    .from("layers")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  const { error: fileError } = await supabase.storage
    .from("layers")
    .remove([data?.file_url?.split("/").pop()])

  if (fileError) {
    console.error(fileError)
    throw fileError
  }

  const { error: processedError } = await supabase.storage
    .from("layers")
    .remove([`processed/${data?.processed_url?.split("/").pop()}`])

  if (processedError) {
    console.error(processedError)
    throw processedError
  }
}
