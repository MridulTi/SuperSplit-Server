import mongoose from "mongoose";

const expenseSchema=mongoose.Schema({
    paidBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    sharedWith:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"SharedWith"
    }],
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    amount:{
        type:Number,
        required:true,
    },
    group:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Group"
    }
},{timestamps:true})

export const Expense=mongoose.model("Expense",expenseSchema)