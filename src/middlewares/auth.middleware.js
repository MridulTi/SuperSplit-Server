<<<<<<< HEAD
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { User } from "../models/User.models.js";


export const verifyJWT=asyncHandler(async(req,res,next)=>{
    try {
        const token=req.cookies?.accessToken||req.body?.token || req.header("Authorization")?.replace("Bearer ","")

        if(!token) throw new ApiError(401, "Unauthorized Request");
        
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user) throw new ApiError(401,"Invalid Access Token");
    
        req.user=user;
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Tokens")   
    }
})
=======
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // here res is not used so we can simply replace it with an underscore "_"
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // usually in authorization header using bearer schema context of header looks like ->  Authorization = Bearer <Token> so we are removing Bearer with empty string to get token
    if (!token) {
      throw new ApiError(401, "authorization failed or unauthorized access ");
    }

    // using jwt method verify to check for token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid access tokem");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid Access Token");
  }
});
>>>>>>> 76acaaad2a527ca2d9f03b29eece8858576f1346
