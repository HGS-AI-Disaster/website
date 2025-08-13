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

function EditVisibility({ layer }) {
  const [open, setOpen] = useState(false) // kontrol buka tutup dialog

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
            onClick={() => {
              const requestOptions = {
                method: "PUT",
                redirect: "follow",
              }

              toast.promise(
                fetch(
                  `http://localhost:3000/api/layer/edit-visibility/${layer.original.id}`,
                  requestOptions
                ).then((response) => {
                  if (!response.ok) {
                    throw new Error("Failed to update layer")
                  }
                  return response.text()
                }),
                {
                  loading: "Updating layer...",
                  success: () => ({
                    description: "Refresh the page to view the changes",
                    action: {
                      label: "Refresh",
                      onClick: () => window.location.reload(),
                    },
                    message: "Layer's visibility has been updated",
                    duration: 15000,
                  }),
                  error: (err) => ({
                    message: "Error",
                    description: err.message || "Failed to update layer",
                  }),
                }
              )

              setOpen(false)
            }}
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditVisibility
