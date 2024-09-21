import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema(
{
    username:{
        type:String,
        required:[true,'Username is Required !'],
        unique:true,
        trim:true,
        index:true,
    },
    email:{
        type:String,
        required:[true,'Email is Required!'],
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //cloudinery Url
        required:true,
    },
    coverImage:{
        type:String, //cloudinery Url
    },
    password:{
        type:String,
        required:[true,'Password is Required!']
    },
    refreshToken:{
        type:String
    },
    watchHistory:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }

},
{
    timestamps:true
}
)

userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();

    this.password=bcrypt.hash(this.password,10)
    next()
})
userSchema.methods.isPasswordMatch=async function (password) {
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.jwtAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
)
}

userSchema.methods.jwtRefreshToken({
    _id:this._id
},
process.env.REFRESH_TOKEN_SECRET,
{
    expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
}
)


export const User = mongoose.model("User",userSchema) 