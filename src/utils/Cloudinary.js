import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import {ApiError} from './ApiError.js'
cloudinary.config({
    cloud_name:'dytrgo2fm',
    api_key:'842765926796613',
    api_secret:'3FeJw5rQ_wH8WzGxxuHCZ9xp4FY'
});

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const uploadResult=await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath)
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        throw new ApiError(400,"Something went wrong on uploading file cloudinary")
        console.log(error)
    }
}

export {uploadOnCloudinary}