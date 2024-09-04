import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // register user
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
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  console.log("req.files : ", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export { registerUser };
