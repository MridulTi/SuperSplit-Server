import mongoose from "mongoose";

const sharedWithSchema=mongoose.Schema({
    Payer:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    Receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    amount:{
        type:Number,
        required:true
    }
},{timestamps:true})

export const SharedWith=mongoose.model("SharedWith",sharedWithSchema)