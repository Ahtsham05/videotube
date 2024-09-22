import { promiseHandler } from "../utils/asyncHandler.js"

const userRegister= promiseHandler(async(req,res)=>{
    // register logic here
    res.status(200).json({
        success:true,
        message:"User registered successfully",
    })
})

export {userRegister}