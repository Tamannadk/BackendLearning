import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
});

export { registerUser, loginUser, logoutUser,refreshAccessToken };
