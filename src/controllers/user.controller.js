import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import fs from 'fs';

const generateRefreshAndAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = await user.generateRefreshToken();
        const accessToken = await user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { refreshToken, accessToken };
    } catch (error) {
        throw new ApiError(500, 'Error while generating refresh token');
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, fullName, password, email } = req.body;
    if (
        [username, fullName, password, email].some(
            (value) => value?.trim() === ''
        )
    ) {
        throw new ApiError(400, 'all fields are required');
    }
    const isExist = await User.findOne({
        $or: [{ username }, { email }],
    });

    let coverLocalPath;
    let avatarLocalPath;

    // handling cover image
    if (
        req.files &&
        Array.isArray(req.files.cover) &&
        req.files.cover.length > 0
    ) {
        coverLocalPath = req.files.cover[0].path;
    }
    // handling avatar image
    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        avatarLocalPath = req.files.avatar[0].path;
    }

    // if user exists then delete the uploaded files and throw error
    if (isExist) {
        if (avatarLocalPath) {
            fs.unlinkSync(avatarLocalPath);
        }
        if (coverLocalPath) {
            fs.unlinkSync(coverLocalPath);
        }
        throw new ApiError(409, 'User with email or username already exists');
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, 'avatar is required');
    }

    // upload images on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const cover = await uploadOnCloudinary(coverLocalPath);

    if (!avatar) {
        throw new ApiError(500, 'avatar upload failed');
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: cover?.url || '',
        password,
        email,
    });

    // temporary fields deletion
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            'Something went wrong while registering the user'
        );
    }
    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, 'User has been created'));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (!(email || username)) {
        throw new ApiError(400, 'username or email is required');
    }
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    const isPassword = await user.isPasswordCorrect(password);

    if (!isPassword) {
        throw new ApiError(401, 'Password incorrect');
    }
    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
        user._id
    );
    const loggedInUser = await User.findById(user._id).select(
        '-password, -refreshToken'
    );
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { loggedInUser, accessToken, refreshToken },
                'Success'
            )
        );
});
export { registerUser, loginUser };
