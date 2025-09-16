import { toast } from "sonner"
import { setProfile, setUser } from "../../../redux/reducers/auth"
import { supabase } from "../index"

export const login = (email, password) => async (dispatch) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    const { user } = data

    // ambil profile user (kalau kamu pakai table profiles)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) throw profileError

    // update Redux state (ga perlu setItem localStorage lagi)
    dispatch(setUser(user))
    dispatch(setProfile(profile))
    toast.success("Login success")

    return { user, profile }
  } catch (err) {
    console.error("Login error:", err)
    toast.error(err.message || "Login failed")
  }
}

export const updateProfile = (values) => async (dispatch, getState) => {
  const state = getState()
  const currentUser = state.auth.user
  const currentProfile = state.auth.profile

  const { email, username, role, password, confirmPassword } = values
  const id = currentUser?.id

  try {
    // Update email kalau beda
    if (email && email !== currentUser.email) {
      const { data: emailData, error: emailError } =
        await supabase.auth.updateUser(
          { email },
          {
            emailRedirectTo: `${
              import.meta.env.VITE_FRONTEND_API
            }/auth/callback`,
          }
        )

      if (emailError) throw emailError
      toast.success(
        "Email verification sent. Please check your old and new email inbox to verify.",
        { duration: 10000 }
      )
      dispatch(setUser(emailData.user))
    }

    // Update profile table kalau ada perubahan
    if (username !== currentProfile.username || role !== currentProfile.role) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .update({ username, role })
        .eq("id", id)
        .select("*")
        .single()

      if (profileError) throw profileError

      dispatch(setProfile(profile))
      toast.success("Profile updated successfully", { duration: 10000 })
    }

    // Update password kalau valid
    if (password && confirmPassword && password === confirmPassword) {
      const { error: pwError } = await supabase.auth.updateUser({ password })
      if (pwError) throw pwError

      toast.success("Password changed", { duration: 10000 })
    }
  } catch (error) {
    console.error("Update profile error:", error)
    toast.error(error.message || "Failed to update profile")
  }
}

export const logout = () => async (dispatch) => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    dispatch(setUser(null))
    dispatch(setProfile(null))

    toast.success("You have been logged out")
  } catch (error) {
    console.error("Logout error:", err)
    toast.error(err.message || "Logout failed")
  }
}
