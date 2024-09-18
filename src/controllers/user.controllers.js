import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and Access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // 𝗿𝗲𝗴𝗶𝘀𝘁𝗲𝗿 𝘂𝘀𝗲𝗿
  // 1) ⁡⁢⁣⁣𝘨𝘦𝘵 𝘶𝘴𝘦𝘳 𝘥𝘦𝘵𝘢𝘪𝘭𝘴 𝘧𝘳𝘰𝘮 𝘧𝘳𝘰𝘯𝘵𝘦𝘯𝘥⁡
  // 2) ⁡⁢⁣⁣𝘷𝘢𝘭𝘪𝘥𝘢𝘵𝘪𝘰𝘯 - 𝘯𝘰𝘵 𝘦𝘮𝘱𝘵𝘺⁡
  // 3) ⁡⁢⁣⁣𝘤𝘩𝘦𝘤𝘬 𝘪𝘧 𝘶𝘴𝘦𝘳 𝘢𝘭𝘳𝘦𝘢𝘥𝘺 𝘦𝘹𝘪𝘴𝘵𝘴⁡ : ⁡⁢⁢⁣𝘶𝘴𝘦𝘳𝘯𝘢𝘮𝘦, 𝘦𝘮𝘢𝘪𝘭⁡
  // 4) ⁡⁢⁣⁣𝘤𝘩𝘦𝘤𝘬 𝘧𝘰𝘳 𝘪𝘮𝘢𝘨𝘦𝘴, 𝘤𝘩𝘦𝘤𝘬 𝘧𝘰𝘳 𝘢𝘷𝘢𝘵𝘢𝘳⁡
  // 5) ⁡⁢⁣⁣𝘶𝘱𝘭𝘰𝘢𝘥 𝘵𝘩𝘦𝘮 𝘵𝘰 𝘤𝘭𝘰𝘶𝘥𝘪𝘯𝘢𝘳𝘺⁡, ⁡⁢⁣⁣𝘢𝘷𝘢𝘵𝘢𝘳⁡
  // 6) ⁡⁢⁣⁣𝘤𝘳𝘦𝘢𝘵𝘦 𝘶𝘴𝘦𝘳 𝘰𝘣𝘫𝘦𝘤𝘵⁡ - ⁡⁢⁢⁢create entry in db⁡
  // 7) ⁡⁢⁣⁣𝘳𝘦𝘮𝘰𝘷𝘦 𝘱𝘢𝘴𝘴𝘸𝘰𝘳𝘥 𝘢𝘯𝘥 𝘳𝘦𝘧𝘳𝘦𝘴𝘩 𝘵𝘰𝘬𝘦𝘯 𝘧𝘪𝘦𝘭𝘥 𝘧𝘳𝘰𝘮 𝘳𝘦𝘴𝘱𝘰𝘯𝘴𝘦⁡
  // 8) ⁡⁢⁣⁣𝘤𝘩𝘦𝘤𝘬 𝘧𝘰𝘳 𝘶𝘴𝘦𝘳 𝘤𝘳𝘦𝘢𝘵𝘪𝘰𝘯⁡
  // 9) ⁡⁢⁣⁣𝘳𝘦𝘵𝘶𝘳𝘯 𝘳𝘦𝘴⁡

  // ⁡⁣⁢⁣𝙂𝙚𝙩 𝙪𝙨𝙚𝙧 𝙙𝙚𝙩𝙖𝙞𝙡𝙨⁡
  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  console.log("req.files : ", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user!");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //1) ⁡⁣⁣⁢𝘨𝘦𝘵 𝘥𝘢𝘵𝘢 𝘧𝘳𝘰𝘮 𝘳𝘦𝘲 𝘣𝘰𝘥𝘺⁡
  //2) ⁡⁣⁣⁢𝘶𝘴𝘦𝘳𝘯𝘢𝘮𝘦 𝘰𝘳 𝘦𝘮𝘢𝘪𝘭⁡
  //3) ⁡⁣⁣⁢𝘧𝘪𝘯𝘥 𝘵𝘩𝘦 𝘶𝘴𝘦𝘳 𝘪𝘯 𝘥𝘣⁡
  //4) ⁡⁣⁣⁢𝘱𝘢𝘴𝘴𝘸𝘰𝘳𝘥 𝘤𝘩𝘦𝘤𝘬⁡
  //5) ⁡⁣⁣⁢𝘢𝘤𝘤𝘦𝘴𝘴 𝘢𝘯𝘥 𝘳𝘦𝘧𝘳𝘦𝘴𝘩 𝘵𝘰𝘬𝘦𝘯 𝘨𝘦𝘯𝘦𝘳𝘢𝘵𝘦⁡
  //6) ⁡⁣⁣⁢𝘴𝘦𝘯𝘥 𝘤𝘰𝘰𝘬𝘪𝘦𝘴⁡

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(404, "User deos not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
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
        "User logged In Successfully"
      )
    );
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
    .json(new ApiResponse(200, {}, "User logged Out "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
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
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Inavlid old password");
  }
  user.password = newPassword;
  await User.save({
    validateBeforeSave: false,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched Successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (avatar?.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated Successfully!"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (coverImage?.url) {
    throw new ApiError(400, "Error while uploading on coverImage!");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "Subscription",
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
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  console.log("channel", channel);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched Successfully!!")
    );
});


const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate(
      [
        {
          $match:{
            _id:new mongoose.Types.ObjectId(req.user._id)
          }
        }
        ,
        {
          $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
              {
                $lookup:{
                  from:"users",
                  localField:"owner",
                  foreignField:"_id",
                  as:"owner",
                  pipeline:[
                    {
                      $project:{
                        fullName:1,
                        username:1,
                        avatar:1
                      }
                    },
                    {
                      $addFields:{
                        owner:{
                          $first:"$owner"
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    )
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch History fetched Successfully!!!"
      )
    )
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
