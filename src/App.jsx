import "./index.css"

import { Provider } from "react-redux"
import { Toaster } from "sonner"
import { RouterProvider } from "react-router-dom"
import store from "../redux/store"
import router from "./routes"

function App({ children }) {
  return (
    <Provider store={store}>
      <Toaster
        richColors
        position="top-center"
        expand={true}
      />
      <RouterProvider router={router}>{children}</RouterProvider>
    </Provider>
  )
}

export default App
