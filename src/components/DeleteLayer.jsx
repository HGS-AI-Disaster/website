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
import { deleteLayer } from "@/supabase/actions/layer"

function DeleteLayer({ layer }) {
  const [open, setOpen] = useState(false) // kontrol buka tutup dialog

  const onSubmit = async (id) => {
    toast.promise(deleteLayer(id), {
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
    })

    setOpen(false)
  }

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
            Are you sure to delete {layer.original.layer}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            variant={"destructive"}
            onClick={() => onSubmit(layer.original.id)}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteLayer
