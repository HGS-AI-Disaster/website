import { combineReducers } from "@reduxjs/toolkit"
import auth from "./auth"
import layers from "./layers"

export default combineReducers({
  auth,
  layers,
})
