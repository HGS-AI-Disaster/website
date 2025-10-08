import React, { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CircleUserRound, Layers } from "lucide-react"
import { Badge } from "./ui/badge"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { useDispatch, useSelector } from "react-redux"
import { updateProfile, logout } from "@/supabase/actions/auth"

function Profile() {
  const [openProfile, setOpenProfile] = useState(false)
  const [openLogout, setOpenLogout] = useState(false)
  const data = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  const formSchema = z
    .object({
      username: z.string().min(4, "Username must be at least 4 characters"),
      email: z.email("Email is not valid"),
      role: z.string().min(1, "Role is required"),
      password: z.string().optional(),
      confirmPassword: z.string().optional(),
    })
    .refine(
      (data) => {
        // Kalau password kosong, ga usah validasi sama sekali
        if (!data.password && !data.confirmPassword) return true
        // Kalau password diisi, confirmPassword harus sama
        return data.password === data.confirmPassword
      },
      {
        message: "Password is not matching",
        path: ["confirmPassword"], // error ini muncul di field confirmPassword
      }
    )
    .refine(
      (data) => {
        // Kalau password diisi, minimal 6 karakter
        if (!data.password) return true
        return data.password.length >= 6
      },
      {
        message: "Password must be at least 6 characters",
        path: ["password"],
      }
    )

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: data.profile?.username || "",
      email: data.user?.email || "",
      role: data.profile?.role || "",
      password: "",
      confirmPassword: "",
    },
  })

  const resetForm = () => {
    form.reset({
      username: data.profile?.username || "",
      email: data.user?.email || "",
      role: data.profile?.role || "",
      password: "",
      confirmPassword: "",
    })
  }

  function onSubmit(values) {
    dispatch(updateProfile(values))
    setOpenProfile(false)
  }

  useEffect(() => {
    if (data?.profile && data?.user) {
      form.reset({
        username: data.profile?.username,
        email: data.user?.email,
        role: data.profile?.role,
        password: "",
        confirmPassword: "",
      })
    }
  }, [data.profile, data.user, form])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-person-circle text-gray-500 cursor-pointer w-8 h-8"
            viewBox="0 0 16 16"
          >
            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
            <path
              fill-rule="evenodd"
              d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"
            />
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{data.profile?.username || ""}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenProfile(true)}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenLogout(true)}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={openLogout}
        onOpenChange={(open) => setOpenLogout(open)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>Are you sure to logout?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={() => {
                dispatch(logout())
                setOpenLogout(false)
              }}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={openProfile}
        onOpenChange={(open) => {
          setOpenProfile(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <div className="flex gap-4">
            <div className="profile-picture ">
              <CircleUserRound
                size={70}
                color="grey"
              />
            </div>
            <div className="">
              <DialogTitle className="flex gap-1">
                <div className="">{data.profile?.username || ""}</div>
              </DialogTitle>
              <DialogDescription>
                <span className="email text-gray-500 my-1 block">
                  {data.user?.email}
                </span>
                <Badge
                  variant={"outline"}
                  className={"text-[12px] text-green-400 border-green-200"}
                >
                  {data.profile?.role}
                </Badge>
              </DialogDescription>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="font-semibold mb-3">Profile</div>
              {/* username Field */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage /> {/* Otomatis menampilkan error */}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mt-2">Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage /> {/* Otomatis menampilkan error */}
                  </FormItem>
                )}
              />

              {/* role Field */}
              <FormField
                className={"w-full"}
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className={"w-full"}>
                    <FormLabel className={"mt-2"}>Role</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value) // update value
                      }}
                      value={field.value} // bind current value
                    >
                      <FormControl className={"w-full"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem
                          value="user"
                          disabled
                        >
                          User (Soon)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="change-password font-semibold mb-3 mt-5">
                Change Password
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage /> {/* Otomatis menampilkan error */}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={"mt-2"}>Confirm Password</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage /> {/* Otomatis menampilkan error */}
                  </FormItem>
                )}
              />
              <Button
                variant="outline"
                className="mt-5 me-2"
                type="button"
                onClick={() => {
                  setOpenProfile(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="mt-5 bg-blue-900 hover:bg-blue-950 text-white"
              >
                Update Profile
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Profile
