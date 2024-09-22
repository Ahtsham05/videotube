import { Router } from "express";
import { userRegister } from "../controllers/user.controller.js";

const userRoute=Router()

userRoute.post("/register",userRegister);

export default userRoute;