import { Router } from 'express';
import {
    loginUser,
    logOutUser,
    registerUser,
    refreshAccessToken,
    passwordChange,
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { auth } from '../middlewares/auth.middleware.js';
const router = Router();

router.route('/register').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        {
            name: 'cover',
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route('/login').post(loginUser);
router.route('/logout').post(auth, logOutUser);
router.route('/refresh-token').post(auth, refreshAccessToken);
router.route("/change-password").post(auth, passwordChange)
export default router;
