import { promiseHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { response } from "express";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken =async (userId)=>{
    // generate access and refresh token here
    // return object with access and refresh token
    try {
        const user=await User.findById(userId)

        if(!user) throw new ApiError(404,"User not on genrate token found!")

        const accessToken= user.jwtAccessToken()
        const refreshToken= user.jwtRefreshToken()
        // console.log("AccessToken = "+accessToken, "RefreshToken = "+refreshToken)
        // save refresh token into database
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(400,"Couldn't generate access token")
    }
}

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
    }).select("-password -refreshToken")

    // console.log(user)
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

    try {
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
        // console.log(passwordMatch)
        // console.log(user._id)
        const { accessToken,refreshToken }= await generateAccessTokenAndRefreshToken(user._id)
        console.log(accessToken,refreshToken)
        if(!(accessToken || refreshToken)){
            throw new ApiError(500,"Something went wrong on generate token!")
        }
        const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

        const options={
            httpOnly: true,
            secure: true,
        }

        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
            new ApiResponse(200,"Login User Successfully!",loggedInUser)
        )

    } catch (error) {
        throw new ApiError(400,"Invalid Login Credentials!")
    }
})

const userLogout = promiseHandler(async(req,res)=>{
    // remove access and refresh token from database and set cookie to expire
    // set cookie to client with response
    try {
        const userId=req.user._id;
    const user=await User.findByIdAndUpdate(
        userId,
        {refreshToken: null},
        {new: true}
    ).select("-password -refreshToken")
    if(!user){
        throw new ApiError(500,"Something went wrong on user logout!")
    }

    const options={
        httpOnly: true,
        secure: true,
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(200,"User Logout successfully!",{})
    )
    } catch (error) {
        throw new ApiError(400,"User Logout failed!",error)
    }
})

const refreshAccessToken=promiseHandler(async(req,res)=>{
    // get refresh token from client cookie
    // verify the token
    // generate new access token and refresh token
    // set cookie to client with response
    try {

        const incommingRefreshToken=req.cookies?.refreshToken || req.body.refreshToken;
        if(!incommingRefreshToken){
            throw new ApiError(401,"Refresh token not provided!")
        }

        const decoded=jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        if(!decoded){
            throw new ApiError(401,"unVerified refresh Token!");
        }

        const user =await User.findById(decoded._id).select("-password");
        if(!user){
            throw new ApiError(402,"User Not verified !")
        }
        if(incommingRefreshToken !== user.refreshToken){
            throw new ApiError(404,"Login Not Found!")
        }

        const {accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id);

        return res.status(200).cookie("accessToken",accessToken).cookie("refreshToken",refreshToken).json(
            new ApiResponse(200,"Token Successfully Generated !",{accessToken,refreshToken})
        )
    } catch (error) {
        throw new ApiError(401,"unauthorized access token",error);
    }
})

const getCurrentUser=promiseHandler(async(req,res)=>{
    try {
        return res.status(200).json(
            new ApiResponse(200,"Successfuly Found User!",req.user)
        )
    } catch (error) {
        throw new ApiError(404,"Current User Not Found!!!")
    }
})

const changeCurrentPassword=promiseHandler(async(req,res)=>{
    try {
        const {oldPassword,newPassword}=req.body;
    
        const user=await User.findById(req.user?._id).select("-refreshToken");
        if(!user){
            throw new ApiError(404,"User Not Found For Password!");
        }
        
        const isPasswordMatch=await user.isPasswordMatch(oldPassword);
        if(!isPasswordMatch){
            throw new ApiError(401,"invalid old Password !");
        }

        user.password=newPassword;
        await user.save({validateBeforeSave:false});
    
        return res.status(200).json(
            new ApiResponse(200,"Password Update Successfully!",{})
        )
        
    } catch (error) {
        throw new ApiError(400,"Invalid update Password!")
    }

})

const updateAccountDetails=promiseHandler(async(req,res)=>{
    const {fullName,email}=req.body;
    if(!(fullName && email)){
        throw new ApiError(400,"fullName or email is required!");
    }

    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200,"Updated Profile Successfuly!",user)
    )

})

const updateAvatarImage=promiseHandler(async(req,res)=>{
    try {
        const localAvatarPath=req.file?.path;
        if(!localAvatarPath)
        {
            throw new ApiError(401,"Avatar Local Path not Found!");
        }

        const Avatar=await uploadOnCloudinary(localAvatarPath);
        if(!Avatar.url){
            throw new ApiError(401,"Error On upload Avatar on Cloudinary!");
        }

        const user=await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    avatarImage:Avatar?.url
                }
            },
            {new:true}
        ).select("-password -refreshToken")

        return res.status(200).json(
            new ApiResponse(200,"Successfully Updated Avatar Image!",user)
        )
    } catch (error) {
        throw new ApiError(400,"Error in update avatarImage!")
    }
})

const updateCoverImage=promiseHandler(async(req,res)=>{
   try {
     const localPathCoverImage=req.file?.path;
     if(!localPathCoverImage){
         throw new ApiError(401,"Cover Image Path Not found");
     }
 
     const coverImage=await uploadOnCloudinary(localPathCoverImage);
     if(!coverImage.url){
         throw new ApiError(401,"coverImage Uploading error on Cloudinary!");
     }
 
     const user=await User.findByIdAndUpdate(
         req.user._id,
         {
             $set:{
                 coverImage:coverImage.url
             }
         },
         {new:true}
     ).select("-password -refreshToken")
 
     return res.status(200).json(
         new ApiResponse(
             200,
             "coverImage update Successfuly!",
             user
         )
     )
   } catch (error) {
    throw new ApiError(401,"Invalid coverImage Update!")
   }
})

const getUserChannelProfile = promiseHandler(async(req,res)=>{
    const {username}=req.params.username
    if(!username?.trim()){
        throw new ApiError(401,"Invalid username!")
    }

    const channelResult=await User.aggregate(
        [
            {
                $match:{
                    username:username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    totallSubscribers:{
                        $size:"$subscribers"
                    },
                    totallSubscribed:{
                        $size:"$subscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if: {$in:[req.user?._id,"$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
                }
            },
            {
                $project:{
                    _id:1,
                    fullName:1,
                    email:1,
                    username:1,
                    avatarImage:1,
                    coverImage:1,
                    totallSubscribed:1,
                    totallSubscribers:1,
                    createdAt:1,
                }
            }
        ]
    )

    if(!channelResult?.length){
        throw new ApiError(401,"Channel Data Fetching Failed !")
    }

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            "fetched aggregate record Successfully",
            channelResult[0]
        )
    )
})

const getWatchHistory = promiseHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200,"Watch History Fetched Successfully!",user[0].watchHistory)
    )
})

export {
    userRegister,
    userLogin,
    userLogout,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateAvatarImage,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}














