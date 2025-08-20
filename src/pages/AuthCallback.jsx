// AuthCallback.jsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace("#", ""))
    const message = params.get("message")
    const type = params.get("type")
    const error = params.get("error")

    if (error) {
      sessionStorage.setItem(
        "auth",
        JSON.stringify({
          status: "error",
          message:
            "This confirmation link has expired. Please log in again to get a new verification email.",
        })
      )
    }

    if (message) {
      // Simpan ke sessionStorage
      sessionStorage.setItem(
        "auth",
        JSON.stringify({
          status: "success",
          message:
            "Step 1 complete! Please check your other email to finish verification.",
        })
      )
    }

    if (type === "email_change") {
      // Simpan ke sessionStorage
      sessionStorage.setItem(
        "auth",
        JSON.stringify({
          status: "success",
          message: "Your email address has been successfully updated.",
        })
      )
    }

    // Redirect ke homepage
    navigate("/")
  }, [navigate])

  return <p>Loading...</p>
}
