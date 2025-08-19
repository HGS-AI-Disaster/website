import axios from "axios"
import { toast } from "sonner"
import { setToken, setUser, setProfile } from "../reducers/auth"

export const login = (email, password) => async (dispatch) => {
  // make loading
  // setIsLoading(true);

  console.log(email, password)

  let data = JSON.stringify({
    email,
    password,
  })

  let config = {
    method: "post",
    url: `${import.meta.env.VITE_BACKEND_API}/auth/login`,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  }

  try {
    const response = await axios.request(config)

    // get and save the token to local storage
    const { data, profile } = response.data
    const { user, session } = data

    console.log(session)

    // Change the token value in the reducer
    dispatch(setToken(session.access_token))
    dispatch(setUser(user))
    dispatch(setProfile(profile))

    toast.success("Login success")
  } catch (error) {
    console.error(error)
    toast.error(error?.response?.data?.message)

    // dispatch(logout())
  }

  // setIsLoading(false);
}
