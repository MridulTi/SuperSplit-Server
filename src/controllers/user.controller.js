import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import mailSender from "../utils/Mailsender.js";
import otpGenerator from "otp-generator";

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

const sendOTP = asyncHandler(async (req, res) => {
  try {
    // Check if user is already present

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const checkUserPresent = await User.findByIdAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          otp: otp,
        },
      }
    );
    await checkUserPresent.sendVerificationCode();
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      checkUserPresent,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { OTP } = req.body;
  if (!OTP) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter OTP" });
  }

  const user = await User.findById(req.user._id);

  if (user.otp === OTP) {
    // If OTP matches, update the user directly using findByIdAndUpdate
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          otp: "",
          isVerified: true,
        },
      },
      { new: true } // To return the updated user document
    );

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      updatedUser,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "OTP is not verified successfully",
    });
  }
});

const registerUser = asyncHandler(async (req, res) => {
  // 1. Fill a form with all field of UserModel from FrontEnd
  // validate these details i.e. some detail is empty or not.
  // 2. Check if a username and email are unique and not already present in the DB
  // 3. Then convert password into hashed one.
  // 4. Upload avatar to cloudinary (check them before uploading)
  // 5. Create User Object - create Entry in DB
  // 6. remove password and refresh token field from response
  // 7. check for user creation
  // 8. return res

  const { fullName, userName, email, password, currency, phoneNumber } =
    req.body;

  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser)
    throw new ApiError(409, "User with email or username already exists");

  // const avatarLocalPath = req.files?.avatar[0]?.path; //path in local server not on cloudinary
  // // console.log(req.files)
  // if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // if (!avatar) throw new ApiError(400, "Avatar not found");

  const user = await User.create({
    fullname: fullName,
    avatar: "",
    email: email.toLowerCase(),
    password,
    currency,
    username: userName?.toLowerCase(),
    phoneNumber,
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
});

const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;
  // console.log(email, password);
  if (!(userName || email))
    throw new ApiError(400, "Username or email is required");

  // if([userName || email,password].some((field)=>
  //     field?.trim()==="")){
  //     throw new ApiError(400,"All fields are required")
  // }
  const loweredEmail = email.toLowerCase();
  const userExits = await User.findOne({ email: loweredEmail });

  if (!userExits) throw new ApiError(409, "User does not exist");
  console.log(userExits);

  const isPasswordValid = await userExits.isPasswordCorrect(password);
  console.log(password, userExits.password);
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
          accessToken,
          refreshToken,
        },
        "User logged in successfully !"
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError(401, "Invalid Refresh Token");

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh Token is Expired or Used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});
const logoutUser = asyncHandler(async (req, res) => {
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
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new ApiError(400, "Invalid old password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  console.log(user);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current User Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, bio, website, BirthDate } = req.body;

  if (!(fullName || email || bio || website || BirthDate)) {
    throw new ApiError(400, "Some field changes are required");
  }
  const updateFields = {};
  if (fullName) updateFields.fullName = fullName;
  if (email) updateFields.email = email;
  if (bio) updateFields.bio = bio;
  if (website) updateFields.website = website;
  if (BirthDate) updateFields.birthDate = BirthDate;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  console.log(req.file);

  const avatarLocalPath = req.file?.buffer;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // const avatar=cloudinary.uploader.upload_stream({ folder: 'avatars' }, (error, result) => {
  // if (error) {
  //   console.error('Error uploading file:', error);
  //   return res.status(500).json({ error: 'Error uploading file' });
  // }})
  // console.log("file uploaded successfylly",avatarLocalPath)
  // if (!avatar) throw new ApiError(400, "Avatar not uploaded");

  // const user = User.findByIdAndUpdate(
  //   req.user?._id,
  //   {
  //     $set: {
  //       avatar: avatar.url,
  //     },
  //   },
  //   { new: true }
  // ).select("-password");

  return res.status(200).json(new ApiError("Error"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  console.log(username);

  if (!username?.trim()) throw new ApiError(401, "Username is missing");

  const channel = await User.aggregate([
    {
      $match: {
        userName: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        username: 1,
        bio: 1,
        avatar: 1,
        category: 1,
        companyName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) throw new ApiError(404, "Channel does not exists");
  console.log(channel);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getConnections = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const userlist = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId ? userId : req.user._id),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "whomFollowed",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "channel",
              foreignField: "_id",
              as: "user",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              _id: 0,
              user: 1,
            },
          },
          {
            $unwind: "$user",
          },
        ],
      },
    },
    {
      $project: {
        whomFollowed: 1,
        createdAt: 1,
      },
    },
    {
      $unwind: "$whomFollowed",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $limit: 5,
    },
  ]);

  const result = userlist.map((user) => ({
    _id: user.whomFollowed.user._id,
    userName: user.whomFollowed.user.userName,
    fullName: user.whomFollowed.user.fullName,
    avatar: user.whomFollowed.user.avatar,
  }));

  res.status(201).json(new ApiResponse(201, result, "Connection List Fetched"));
});

const searchUser = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query) throw new ApiError(404, "Query parameter is required");

  const users = await User.find({
    userName: { $regex: query, $options: "i" },
  }).limit(10);
  if (!users) throw new ApiError(404, "No such user exists");

  res.status(201).json(new ApiResponse(201, users, "User fetched"));
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateAccountDetails,
  getUserChannelProfile,
  getConnections,
  searchUser,
  sendOTP,
  verifyOTP,
};
