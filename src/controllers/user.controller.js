import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';
import { options } from '../constansts.js';
import { generateRefreshAndAccessToken } from '../utils/generateTokens.js';
import jwt from 'jsonwebtoken';

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
        return res
            .status(409)
            .json({ message: 'User with email or username already exists' });
    }

    if (!avatarLocalPath) {
        return res.status(400).json({ message: 'Avatar is required' });
    }

    // upload images on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const cover = await uploadOnCloudinary(coverLocalPath);

    if (!avatar) {
        return res.status(500).json({ message: 'Avatar upload failed' });
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        avatar: {
            public_id: avatar.public_id,
            url: avatar.url,
        },
        coverImage: {
            public_id: cover.public_id,
            url: cover?.url || '',
        },
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
        return res.status(400).json({ message: 'Password is incorrect' });
    }
    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
        user._id
    );
    const loggedInUser = await User.findById(user._id).select(
        '-password, -refreshToken'
    );

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

const logOutUser = asyncHandler(async (req, res) => {
    const user = req.user;
    await User.findOneAndUpdate(
        { _id: user._id },
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    return res
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'Logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
        return res.status(401).json({ message: 'RefreshToken not found' });
    }
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET);
    if (!decoded) {
        return res.status(401).json({ message: 'DecodedToken not found' });
    }
    const user = await User.findById(decoded._id);
    if (!user) {
        return res
            .status(401)
            .json({ message: 'User not found in DecodedToken' });
    }
    if (user.refreshToken !== token) {
        return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
        user._id
    );

    return res
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                'Token refreshed successfully'
            )
        );
});

const passwordChange = asyncHandler(async (req, res) => {
    const { newPassword, oldPassword } = req.body;

    if (!newPassword || !oldPassword) {
        return res
            .status(400)
            .json({ message: 'Old password and new password are required' });
    }

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Old password is incorrect' });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({ message: 'Password changed successfully' });
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, 'current user fetched successfully')
        );
});

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    passwordChange,
    getCurrentUser,
};
