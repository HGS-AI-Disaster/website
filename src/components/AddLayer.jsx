"use client"

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm, Controller } from "react-hook-form"
import { useState } from "react"
import { toast } from "sonner"
import { addLayer } from "@/supabase/actions/layer"

export default function AddLayer() {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm()

  const [open, setOpen] = useState(false) // kontrol buka tutup dialog
  const [fileName, setFileName] = useState("")

  const onSubmit = async (data) => {
    toast.promise(addLayer(data), {
      loading: "Uploading layer...",
      success: (res) => ({
        message: `Layer for ${new Date(res.layer_date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "long",
          }
        )} has been created`,
        duration: 15000,
      }),
      error: (err) => ({
        message: "Failed to create layer",
        description:
          `${err.message}. Please check your internet connection.` ||
          "Please check your internet connection.",
      }),
    })

    reset()
    setOpen(false)
    setFileName("")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        setOpen(!open)
        setFileName("")
        reset()
      }}
    >
      <DialogTrigger asChild>
        <Button
          className={
            "cursor-pointer bg-blue-900 text-white hover:bg-blue-950 flex items-center gap-1"
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            fill="currentColor"
            className="bi bi-plus"
            viewBox="0 0 14 14"
          >
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
          </svg>
          Add Layer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Add Layer</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 mt-4"
        >
          {/* Upload File */}
          <div className="border-3 border-dashed rounded-md p-4 text-sm text-gray-400 text-center flex flex-col justify-center items-center h-[100px]">
            <Label
              htmlFor="file"
              className="cursor-pointer block"
            >
              Upload GeoJSON file
            </Label>
            <Controller
              name="file"
              control={control}
              rules={{ required: "File is required" }}
              render={({ field }) => (
                <>
                  <Input
                    type="file"
                    accept=".geojson"
                    className="hidden"
                    id="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      field.onChange(file)
                      setFileName(file ? file.name : "")
                    }}
                  />
                  {fileName && (
                    <p className="text-gray-600 text-xs mt-2">
                      Selected: {fileName}
                    </p>
                  )}
                  {errors.file && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.file.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Layer Name */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="layer">Layer Name</Label>
            <Input
              id="layer"
              {...register("layer", { required: true })}
            />
            {errors.layer && (
              <p className="text-red-500 text-xs">Layer name is required</p>
            )}
          </div>

          {/* Layer Category */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="category">Category</Label>
            <Controller
              name="category"
              control={control}
              rules={{ required: "Category is required" }}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cloud">Cloud</SelectItem>
                    <SelectItem value="Earthquake">Earthquake</SelectItem>
                    <SelectItem value="Heavy Rain">Heavy Rain</SelectItem>
                    <SelectItem value="Flood">Flood</SelectItem>
                    <SelectItem value="Typhoon">Typhoon</SelectItem>
                    <SelectItem value="Chiba University">
                      Chiba University
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-red-500 text-xs">{errors.category.message}</p>
            )}
          </div>

          {/* Layer Date */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="layer_date">Layer date</Label>
            <Input
              id="layer_date"
              type="date"
              {...register("date", { required: true })}
            />
            {errors.date && (
              <p className="text-red-500 text-xs">Date is required</p>
            )}
          </div>

          {/* Source */}
          {/* Source */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="source">Source</Label>
            <Controller
              name="source"
              control={control}
              defaultValue="admin"
              rules={{ required: "Source is required" }}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      Admin{" "}
                      <span className="text-xs text-gray-400">(default)</span>
                    </SelectItem>
                    <SelectItem value="prediction">Prediction</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.source && (
              <p className="text-red-500 text-xs">{errors.source.message}</p>
            )}
          </div>

          {/* Visibility */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Controller
              name="visibility"
              control={control}
              rules={{ required: "Visibility is required" }}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.visibility && (
              <p className="text-red-500 text-xs">
                {errors.visibility.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-950 text-white mt-2"
          >
            Upload Layer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
