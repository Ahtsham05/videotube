import { Router } from "express";
import { userLogin, userRegister , userLogout} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtverify } from "../middlewares/Auth.middleware.js";

const userRoute=Router()

userRoute.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    userRegister
)
userRoute.route("/login").post(userLogin)

userRoute.route("/logout").post(jwtverify,userLogout)


export default userRoute;