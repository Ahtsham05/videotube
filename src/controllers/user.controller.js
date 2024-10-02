import { promiseHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessTokenAndRefreshToken =promiseHandler(async (userId)=>{
    // generate access and refresh token here
    // return object with access and refresh token
    try {
        const user=await User.findById(userId)
        if(!user) throw new ApiError(404,"User not on genrate token found!")
        const accessToken=await user.jwtAccessToken()
        const refreshToken=await user.jwtRefreshToken()
        // save refresh token into database
        user.refreshToken=await refreshToken;
        await user.save();
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(400,"Couldn't generate access token")
    }
})

const userRegister= promiseHandler(async(req, res)=>{
    // register logic here
    
    // get data from user 
    // validate all fields
    // username, email are unique or existed
    // avatar image required
    // upload avatar , backgroud cover image on cloudinary
    // save local path to varibale
    // send object to create db request for save data into database

    const {username,email,fullName,password} = req.body

    if (
        [username,email,fullName,password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409,"username or email already existed!")
    }
    // console.log(req.files.avatar[0])
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    // console.log(avatarLocalPath)
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is required!");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    // console.log("avatar"+avatar)
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    console.log(user)
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something Went wrong on user register!");
    }

    return res.status(201).json( 
        new ApiResponse(200,"User registration successfully!",createdUser)
    )
    
})

const userLogin=promiseHandler(async (req,res)=>{
    // data => req->body
    // check user or email not empty
    // check user or email existed in database
    // check password not empty
    // check password compare from database
    // generate access token and refresh token
    // set cookie to client with response

    const {username,email,password}=req.body

    if(!(email || username)){
        throw new ApiError(400,"Invalid email or password")
    }

    const user = await User.findOne({
        $or:[{email},{username}]
    })
    if(!user){
        throw new ApiError(401,"Invalid username or Email")
    }

    const passwordMatch=await user.isPasswordMatch(password);
    if(!passwordMatch){
        throw new ApiError(401,"Invalid password!")
    }

    const {accessToken,refreshToken}=generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id)
    options={
        httpOnly: true,
        secure: true,
    }

    res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,"Login User Successfully!",loggedInUser)
    )

})

const userLogout = promiseHandler(async(req,res)=>{
    // remove access and refresh token from database and set cookie to expire
    // set cookie to client with response
    const userId=req.user._id;
    const user=await User.findByIdAndUpdate(
        userId,
        {refreshToken: null},
        {new: true}
    )
    if(!user){
        throw new ApiError(500,"Something went wrong on user logout!")
    }
    const options={
        // expires: new Date(0),
        httpOnly: true,
        secure: true,
    }
    res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(200,"User Logout successfully!",{
            user:user,accessToken,refreshToken
        })
    )
})
export {userRegister,userLogin,userLogout}














