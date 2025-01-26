import mongoose from "mongoose";

const transactionSchema=mongoose.Schema({
    from:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    to:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    status:{
        type:String,
        required:true,
        enum:['Pending','Successful','Rejected']
    },
    group:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Group"
    },
    amount:{
        type:Number,
        required:true
    },
    expense: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense"
    }
},{timestamps:true})

transactionSchema.post('save', async function (doc, next) {
    try {
        if (doc.status === 'Successful') {
            await Expense.findByIdAndUpdate(
                doc.expense,
                { $inc: { amount: doc.amount } }
            );
        }
        next();
    } catch (error) {
        next(error);
    }
});


transactionSchema.post('findOneAndDelete', async function (doc, next) {
    try {
        if (doc && doc.status === 'Successful') {
            await Expense.findByIdAndUpdate(
                doc.expense,
                { $inc: { amount: -doc.amount } }
            );
        }
        next();
    } catch (error) {
        next(error);
    }
});

export const Transaction= mongoose.model("Transaction",transactionSchema);