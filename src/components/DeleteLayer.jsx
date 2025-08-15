import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "./ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

function DeleteLayer({ layer }) {
  const [open, setOpen] = useState(false) // kontrol buka tutup dialog

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger>
        <Trash2
          className="size-[1rem] cursor-pointer"
          stroke="red"
        />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete layer</DialogTitle>
          <DialogDescription>
            Are you sure to delete {layer.original.layer}?{" "}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            variant={"destructive"}
            onClick={() => {
              const formdata = new FormData()
              formdata.append("layer", layer.original.layer)
              formdata.append("category", layer.original.category)
              formdata.append("layer_date", layer.original.layer_date)
              formdata.append("source", layer.original.source)
              formdata.append("visibility", layer.original.visibility)
              formdata.append("description", layer.original.description)

              const requestOptions = {
                method: "DELETE",
                body: formdata,
                redirect: "follow",
              }

              toast.promise(
                fetch(
                  `http://localhost:3000/api/layer/${layer.original.id}`,
                  requestOptions
                ).then((response) => {
                  if (!response.ok) {
                    throw new Error("Failed to delete layer")
                  }
                  return response.text()
                }),
                {
                  loading: "Deleting layer...",
                  success: () => ({
                    description: "Refresh the page to view the changes",
                    action: {
                      label: "Refresh",
                      onClick: () => window.location.reload(),
                    },
                    message: "Layer has been deleted",
                    duration: 15000,
                  }),
                  error: (err) => ({
                    message: "Error",
                    description: err.message || "Failed to delete layer",
                  }),
                }
              )

              setOpen(false)
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteLayer
