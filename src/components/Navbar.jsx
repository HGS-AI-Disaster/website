import React, { useState } from "react"
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

function Navbar() {
  const [isLogin, setIsLogin] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)

  function login() {
    if (!isLogin) {
      setIsLogin(true)
    }
  }

  const formSchema = z
    .object({
      username: z.string().min(4, "Username must be at least 4 characters"),
      email: z.string().email("Email is not valid"),
      password: z.string().optional(),
      confirmPassword: z.string().optional(),
    })
    .refine(
      (data) => {
        // Kalau password kosong → tidak usah validasi sama sekali
        if (!data.password && !data.confirmPassword) return true
        // Kalau password diisi → confirmPassword harus sama
        return data.password === data.confirmPassword
      },
      {
        message: "Password is not matching",
        path: ["confirmPassword"], // error ini muncul di field confirmPassword
      }
    )
    .refine(
      (data) => {
        // Kalau password diisi → minimal 8 karakter
        if (!data.password) return true
        return data.password.length >= 4
      },
      {
        message: "Password must be at least 4 characters",
        path: ["password"],
      }
    )

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "Admin 01",
      email: "aidisastermitigation@gmail.com",
      role: "admin",
    },
  })

  function onSubmit(values) {
    console.log(values)
    setOpenProfile(false)
  }

  return (
    <div className="navbar w-full py-4 px-8 flex justify-between z-20 bg-gray-50 shadow-md">
      <div className="text text-2xl font-semibold">
        AI Disaster Mitigation Platform
      </div>
      {isLogin ? (
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
              <DropdownMenuLabel>Admin 01</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpenProfile(true)}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={openProfile}
            onOpenChange={setOpenProfile}
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
                    <div className="">Admin 01</div>
                    <Badge
                      variant={"outline"}
                      className={"text-[12px] text-green-400 border-green-200"}
                    >
                      admin
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    <div className="email text-gray-500 my-1">
                      aidisastermitigation@gmail.com
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-[12px] text-black px-2 py-1"
                    >
                      <Layers
                        size={16}
                        color="grey"
                      />
                      11 layers added
                    </Button>
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
                        <FormLabel>Email</FormLabel>
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
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl className={"w-full"}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
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
                        <FormLabel className={"mt-2"}>
                          Confirm Password
                        </FormLabel>
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
      ) : (
        <Dialog>
          <form>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={"cursor-pointer"}
              >
                Login as admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Login as Admin</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="username-1">Username</Label>
                  <Input
                    id="username-1"
                    name="username"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type={"password"}
                    name="password"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    type="submit"
                    onClick={() => login()}
                  >
                    Login
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </form>
        </Dialog>
      )}
    </div>
  )
}

export default Navbar
