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
import Map from "./components/Map"
import Navigation from "./components/Navigation"
import { useState } from "react"
import LayerManagement from "./components/LayerManagement"

function App() {
  const [isLogin, setIsLogin] = useState(false)

  function login() {
    if (!isLogin) {
      setIsLogin(true)
    }
  }

  return (
    <>
      <div className="h-screen flex flex-col">
        <div className="navbar w-full py-4 px-8 flex justify-between z-20 bg-gray-50 shadow-md">
          <div className="text text-2xl font-semibold">
            AI Disaster Mitigation Platform
          </div>
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
        </div>
        <Map />
        <Navigation />
      </div>
      {isLogin && <LayerManagement />}
    </>
  )
}

export default App
