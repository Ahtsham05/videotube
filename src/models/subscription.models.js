import mongoose, {Schema} from 'mongoose';

const subcriptionSchema= new Schema({
    subscribers:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type: Schema.Types.ObjectId,
        ref:"User"
    }
})

export const Subscription=mongoose.model('Subscription',subcriptionSchema);