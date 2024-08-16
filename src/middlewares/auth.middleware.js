import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

const auth = async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new ApiError(401, 'Unauthorized');
        }
        const decoded = jwt.verify(token, process.env.ACCESSTOKEN_SECRET);

        if (!decoded) {
            throw new ApiError(401, 'Unauthorized');
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ messsage: 'User is not verified', error });
    }
};

export { auth };
