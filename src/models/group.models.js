import mongoose from "mongoose";

const groupSchema=mongoose.Schema({
    participants:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },
    currency:{
        type:String,
        enum:["$","₹"]
    },
    expenses:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Expense"
        }
    ]
},{timestamps:true})

export const Group=mongoose.model("Group",groupSchema)
