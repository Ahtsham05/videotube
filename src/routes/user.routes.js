import { Router } from "express";
import { 
    userLogin, 
    userRegister , 
    userLogout, 
    refreshAccessToken, 
    getCurrentUser, 
    changeCurrentPassword, 
    updateAccountDetails, 
    updateAvatarImage, 
    updateCoverImage, 
    getUserChannelProfile, 
    getWatchHistory
} from "../controllers/user.controller.js";
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
userRoute.route("/refresh-token").post(refreshAccessToken)
userRoute.route("/user").post(jwtverify,getCurrentUser)
userRoute.route("/change-password").post(jwtverify,changeCurrentPassword)
userRoute.route("/update-user").post(jwtverify,updateAccountDetails)
userRoute.route("/update-avatar").post(jwtverify,upload.single("avatar"),updateAvatarImage)
userRoute.route("/update-coverimage").post(jwtverify,upload.single("coverImage"),updateCoverImage)
userRoute.route("/c/:username").get(jwtverify,getUserChannelProfile)
userRoute.route("/watch-history").get(jwtverify,getWatchHistory)

export default userRoute;