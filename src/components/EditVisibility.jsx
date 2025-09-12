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
import { Eye, EyeClosed } from "lucide-react"
import { toast } from "sonner"
import { editVisibility } from "@/supabase/actions/layer"

function EditVisibility({ layer }) {
  const [open, setOpen] = useState(false) // kontrol buka tutup dialog

  const onSubmit = async (id) => {
    toast.promise(editVisibility(id), {
      loading: "Updating layer...",
      success: () => ({
        message: "Layer's visibility has been updated",
        duration: 15000,
      }),
      error: (err) => ({
        message: "Failed to update layer",
        description: err.message || "Failed to update layer",
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
        {layer.original.visibility === "public" ? (
          <Eye className="size-[1rem] cursor-pointer" />
        ) : (
          <EyeClosed className="size-[1rem] cursor-pointer" />
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Set visibility to{" "}
            {layer.original.visibility === "public" ? "private" : "public"}?
          </DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={() => onSubmit(layer.original.id)}
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditVisibility
