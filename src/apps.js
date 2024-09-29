import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import dotenv from "dotenv"
import userRouter from "./routes/user.routes.js"
import connectDB from "./db/index.js"

const app = express()
dotenv.config({path : '/.env'})

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({limit: "16kb"}))

app.use(express.urlencoded({extended: true , limit: "16kb"}))


app.use(express.static("public"))

app.use(cookieParser())


//ROUTES
app.use("/api/v1/user", userRouter)



connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8001 , ()=>{
    console.log(`server is running at port ${process.env.PORT}`)
  })
  app.on("error",()=>{
    console.log("error is found in server",error)
  })
})

.catch((err)=>{
  console.log("MONGODB connection failed",err)
})
