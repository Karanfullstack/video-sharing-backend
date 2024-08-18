import { Router } from 'express';
import {
    loginUser,
    logOutUser,
    registerUser,
    refreshAccessToken,
    passwordChange,
    getCurrentUser,
    updateUserDetails,
    updateAvatar,
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

// Private Routes
router.route('/logout').post(auth, logOutUser);
router.route('/refresh-token').post(auth, refreshAccessToken);
router.route('/change-password').post(auth, passwordChange);
router.route('/current-user').get(auth, getCurrentUser);
router.route('/update-details').patch(auth, updateUserDetails);
router
    .route('/update-avatar')
    .patch(auth, upload.single('avatar'), updateAvatar);

export default router;
