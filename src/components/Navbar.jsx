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
import Profile from "./Profile"
import Login from "./Login"
import { useDispatch, useSelector } from "react-redux"

function Navbar() {
  const { user } = useSelector((state) => state.auth)

  return (
    <div className="navbar w-full py-4 px-8 flex justify-between z-[20] bg-gray-50 shadow-md">
      <div className="text text-2xl font-semibold">
        AI Disaster Mitigation Platform
      </div>
      {user ? <Profile /> : <Login />}
    </div>
  )
}

export default Navbar
