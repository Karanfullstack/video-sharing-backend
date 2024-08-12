import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model';
const registerUser = asyncHandler(async (req, res) => {
    const { username, fullname, password, email } = req.body;
});

export { registerUser };
