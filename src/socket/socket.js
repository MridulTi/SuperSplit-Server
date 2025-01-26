import express from "express";
import {Server} from "socket.io"
import { createServer } from "node:http";


const app = express();

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
});

const userSocketMap={}

const getReceiverSocketID=(receiverId)=>{
    return userSocketMap[receiverId]
}

io.on("connection", (socket) => {
    console.log("a user connected", socket.io);


    const userId=socket.handshake.query.userId;
    if (userId!="undefined") userSocketMap[userId]=socket.id
    // socket.emit("live",{"mssg":"HWKKI"})
    // socket.broadcast.emit("live",{"mssg":`${socket.id} joined the server.`})

    // message event
    socket.on("message", (data) => {
        console.log(data);
        io.emit("receive-message", data);
    });
    // Join Group
    socket.on("join-room", (room) => {
        socket.join(room);
        console.log("user join the room", room);
    });

    //group message
    socket.on("message-to-room", (data) => {
        const { message, room } = data;
        io.to(room).emit("receive-room-message", message);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
    });
});

export { app, io, server ,getReceiverSocketID}