import { ApiError } from "../utils/ApiError";
import { promiseHandler } from "../utils/asyncHandler";

const jwtverify=promiseHandler((req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.Header("Authorization")
        if (!token) {
            throw new ApiError(401, "Token not provided!");
        }
        const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        throw new ApiError(404,"User not found!",error);
    }
})

export {jwtverify}