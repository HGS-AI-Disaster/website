"use client"

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useEffect } from "react"
import { toast } from "sonner"
import { editLayer } from "@/supabase/actions/layer"

export default function EditLayer({ layer }) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm()
  const [open, setOpen] = useState(false) // kontrol buka tutup dialog

  const [fileName, setFileName] = useState("")

  const onSubmit = (data) => {
    toast.promise(editLayer({ id: layer.id, data }), {
      loading: "Updating layer...",
      success: () => ({
        message: "Layer has been updated",
        duration: 15000,
      }),
      error: (err) => ({
        message: "Error",
        description: err.message || "Failed to update layer",
        duration: 15000,
      }),
    })

    reset()
    setFileName("")
    setOpen(false)
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
        <Pencil className="size-[1rem] cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Edit Layer</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 mt-4"
        >
          {/* Upload File */}
          <div className="border-3 relative border-dashed rounded-md text-sm text-gray-400 text-center flex flex-col justify-center items-center h-[100px]">
            <Label
              htmlFor="file"
              className="cursor-pointer flex justify-center items-center h-full w-full "
            >
              Update file GeoJSON
            </Label>
            <Controller
              name="file"
              control={control}
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
                  <p className="text-gray-600 text-xs mt-2 absolute top-12">
                    Selected:{" "}
                    {fileName ? (
                      fileName
                    ) : layer.file_url ? (
                      <a
                        href={layer.file_url}
                        className="text-blue-500 underline"
                      >
                        {layer.file_url.split("/").pop()}
                      </a>
                    ) : (
                      <span className="text-red-500">File not found</span>
                    )}
                  </p>
                  {/* <button onClick={() => console.log(layer)}>test</button> */}
                </>
              )}
            />
            {errors.file && (
              <p className="text-red-500 text-xs mt-1">File is required</p>
            )}
          </div>

          {/* Layer Name */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="layer">Layer Name</Label>
            <Input
              id="layer"
              //   placeholder="Layer Name"
              defaultValue={layer.layer}
              {...register("name", { required: true })}
            />
            {errors.name && (
              <p className="text-red-500 text-xs">Layer name is required</p>
            )}
          </div>

          {/* Layer Category */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="category">Category</Label>
            <Controller
              name="category"
              control={control}
              defaultValue={layer.category}
              rules={{ required: true }}
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
              <p className="text-red-500 text-xs">Category is required</p>
            )}
          </div>

          {/* Layer Date */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="layer_date">Layer date</Label>
            <Input
              id="layer_date"
              type="date"
              defaultValue={layer.layer_date}
              {...register("date", {
                required: true,
              })}
            />
            {errors.date && (
              <p className="text-red-500 text-xs">Date is required</p>
            )}
          </div>

          {/* Source */}
          <div className="grid w-full items-center gap-2">
            {/* <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              {...register("source")}
              defaultValue={layer.source}
            /> */}
            <Label htmlFor="source">Source</Label>
            <Controller
              name="source"
              control={control}
              defaultValue={layer.source}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="prediction">Prediction</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.visibility && (
              <p className="text-red-500 text-xs">Visibility is required</p>
            )}
          </div>

          {/* Visibility */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Controller
              name="visibility"
              control={control}
              defaultValue={layer.visibility}
              rules={{ required: true }}
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
              <p className="text-red-500 text-xs">Visibility is required</p>
            )}
          </div>

          {/* Description */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              defaultValue={layer.description || ""}
              {...register("description")}
            />
          </div>

          <div className="w-full flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button
              type="submit"
              className=" bg-blue-900 hover:bg-blue-950 text-white"
            >
              Update Layer
            </Button>
          </div>
        </form>
        {/* Submit */}
      </DialogContent>
    </Dialog>
  )
}
