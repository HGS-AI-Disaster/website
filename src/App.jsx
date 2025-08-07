import "./index.css"
import { Button } from "./components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Navigation from "./components/Navigation"
import { useEffect, useState } from "react"
import LayerManagement from "./components/LayerManagement"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import GoogleMaps from "./components/GoogleMaps"

function App() {
  const [isLogin, setIsLogin] = useState(false)
  const [layers, setLayers] = useState({})
  const [error, setError] = useState(null)

  function login() {
    if (!isLogin) {
      setIsLogin(true)
    }
  }

  useEffect(() => {
    const getLayers = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/layer")
        const json = await res.json()
        if (!res.ok) throw new Error(json.message || "Gagal fetch layer")
        setLayers(json.data)
      } catch (err) {
        setError(err.message)
      } finally {
        console.log(layers)
      }
    }

    getLayers()
  }, [])

  return (
    <>
      <div className="h-screen flex flex-col">
        <div className="navbar w-full py-4 px-8 flex justify-between z-20 bg-gray-50 shadow-md">
          <div className="text text-2xl font-semibold">
            AI Disaster Mitigation Platform
          </div>
          {isLogin ? (
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
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        <GoogleMaps />
        <Navigation />
      </div>
      {/* <GoogleMaps /> */}
      {isLogin && <LayerManagement />}
    </>
  )
}

export default App
