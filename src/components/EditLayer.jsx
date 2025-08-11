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
import { useForm } from "react-hook-form"
import { Pencil } from "lucide-react"

export default function EditLayer({ layer }) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm()

  const onSubmit = (data) => {
    console.log(data)
    reset()
  }

  return (
    <Dialog>
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
          <div className="border-3 border-dashed rounded-md p-4 text-sm text-gray-400 text-center flex flex-col justify-center items-center h-[100px]">
            <Label
              htmlFor="file"
              className="cursor-pointer block"
            >
              Upload file .tiff or GeoJSON
            </Label>
            <Input
              type="file"
              accept=".tiff,.geojson"
              {...register("file", { required: true })}
              className="hidden"
              id="file"
            />
            {errors.file && (
              <p className="text-red-500 text-xs mt-1">File is required</p>
            )}
          </div>

          {/* Layer Name */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="layerName">Layer Name</Label>
            <Input
              id="layerName"
              //   placeholder="Layer Name"
              defaultValue={layer.original.layer}
              {...register("name", { required: true })}
            />
            {errors.name && (
              <p className="text-red-500 text-xs">Layer name is required</p>
            )}
          </div>

          {/* Layer Category */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              className="w-full"
              onValueChange={(val) => setValue("category", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="flood">Flood</SelectItem>
                <SelectItem value="earthquake">Earthquake</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-500 text-xs">Category is required</p>
            )}
          </div>

          {/* Layer Date */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="layerDate">Layer date</Label>
            <Input
              id="layerDate"
              type="date"
              {...register("date", { required: true })}
            />
            {errors.date && (
              <p className="text-red-500 text-xs">Date is required</p>
            )}
          </div>

          {/* Source */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              {...register("source")}
              defaultValue={layer.original.source}
            />
          </div>

          {/* Visibility */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              id="visibility"
              className="w-full"
              onValueChange={(val) => setValue("visibility", val)}
            >
              <SelectTrigger className={"w-full"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            {errors.visibility && (
              <p className="text-red-500 text-xs">Visibility is required</p>
            )}
          </div>

          {/* Description */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              {...register("description")}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-950 text-white mt-2"
          >
            Update Layer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
