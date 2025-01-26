import cors from "cors"
import express from "express"
import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app, server } from "./socket/socket.js";
import cookieParser from "cookie-parser";
dotenv.config({
  path:'./.env'
})


app.use(cors({
  origin:process.env.CORS_ORIGIN,
  credentials:true,
  
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import Router from "./routes/routes.js"


// routes declaration
app.use("/api/v1/",Router) 



connectDB()
  .then(()=>{
    app.on("error",(error)=>{
      console.log("ERR: ",error)
      throw error
    })
    server.listen(process.env.PORT || 8000,()=>{
      console.log(`Server is running at port : ${process.env.PORT}`)
    })
  })
  .catch((err)=>{
    console.error("MONGO DB Connection Failed !", err)
  });
