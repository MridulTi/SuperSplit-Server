import mongoose from "mongoose";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/User.models.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
      const user = await User.findById(userId);
      const accessToken = await user.generateAccessToken();
      const refreshToken = await user.generateRefreshToken();
  
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
  
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while generating Refresh and Access Token"
      );
    }
};

const SignupController=asyncHandler(async(req,res)=>{
    const { fullName, userName, email, password, phoneNumber } =
    req.body;

  if (
    [fullName, userName, email, password].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser)
    throw new ApiError(409, "User with email or username already exists");
  if (phoneNumber.length!=10){
    console.log(phoneNumber.length)
    throw new ApiError(409, "Phone Number is not valid");

  }

  const user = await User.create({
    fullname: fullName,
    email:email.toLowerCase(),
    password,
    username: userName?.toLowerCase(),
    phoneNumber
  });
  console.log(user);

  // Full proof idea
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering the user");

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully !"));

})
const LoginController=asyncHandler(async(req,res)=>{
    const { userName, email, password } = req.body;
  // console.log(email, password);
  if (!(userName || email))
    throw new ApiError(400, "Username or email is required");

  if([userName || email||password].some((field)=>
      field?.trim()==="")){
      throw new ApiError(400,"All fields are required")
  }
  const loweredEmail=email.toLowerCase()
  const userExits = await User.findOne({ email:loweredEmail});
  
  if (!userExits) throw new ApiError(409, "User does not exist");

  const isPasswordValid = await userExits.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    userExits._id
  );
  const loggedInUser = await User.findById(userExits._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
        },
        "User logged in successfully !"
      )
    );
})
const LogoutController=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            refreshToken: undefined,
          },
        },
        {
          // new updated value returned as response
          new: true,
        }
      );
      const options = {
        httpOnly: true,
        secure: true,
      };
      return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged out!"));
})

export {
    SignupController,
    LoginController,
    LogoutController
}