import express from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Conversation } from "../models/conversation.models.js";
import { Message } from "../models/message.models.js";

const sendMessage=asyncHandler(async(req,res)=>{
    try {
        const {message}=req.body;
        const {id:receiverId}=req.params;
        const senderId=req.user?._id

        let conversation=await Conversation.findOne({
            participants:{
                $all:[senderId,receiverId]
            }
        })

        if (!conversation) {
            conversation=await Conversation.create({
                participants:[senderId,receiverId],
            })
        }

        const newMessage=new Message({
            senderID:senderId,
            receiverID:receiverId,
            message
        })
        if (newMessage){
            conversation.message.push(newMessage._id)
        }
        // these both will run in parallel
        await Promise.all([conversation.save(),newMessage.save()]);

        // SOCKET IO
        // const receiverSocketId=getReceiverSocketID(receiverId)
        // if (receiverSocketId){
        //     // io.to(<socket_id>).emit() is used to send events to specific client
        //     io.to(receiverSocketId).emit('message',newMessage)
        // }
        res.status(201).json(new ApiResponse(201,newMessage,"Message sent!"))
    } catch (error) {
        res.status(400).json(new ApiError(400,"Error occured while sending Message",error))
    }
})

const getMessage=asyncHandler(async(req,res)=>{
    try {
        const {id:userToChatId}=req.params;
        const senderId=req.user?._id

        
        const conversation=await Conversation.findOne({
            participants:{$all:[senderId,userToChatId]},
        }).populate("message");// NOT REFERENCE BUT ACTUAL MESSAGES

        if (!conversation) throw new ApiError(400,"Conversation not found")

        res.status(201)
        .json(new ApiResponse(201,conversation.message,"Messages Fetched between Participants"))
    } catch (error) {
        res.status(400)
        .json(new ApiError(400,'Error Occured while fetching message',error))
    }
})

export {
    sendMessage,
    getMessage
}