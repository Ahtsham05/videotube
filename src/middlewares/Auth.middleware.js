import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { promiseHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
const jwtverify=promiseHandler(async (req,res,next)=>{
    try {
        console.log(req)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Token not provided!");
        }
        const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        if(!decoded){
            throw new ApiError(403,"Invalid token!");
        }
        const user = await User.findById(decoded._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(404, "User in jwt not found!");
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(404,"User not found!");
    }
})

export {jwtverify}