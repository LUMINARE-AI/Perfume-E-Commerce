import {Router} from "express";
import { registerUser, loginUser, logoutUser, RefreshAccessToken, forgotPassword, resetPassword, getMe,
  updateMe,
  getAddress,
  updateAddress,
  changePassword, } from "../controllers/user.controller.js";
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router()

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/forgot-password').post(forgotPassword);
router.get("/me", verifyJWT, getMe);
router.put("/me", verifyJWT, updateMe);

router.get("/address", verifyJWT, getAddress);
router.put("/address", verifyJWT, updateAddress);

router.put("/change-password", verifyJWT, changePassword);
//secured routes
router.route('/logout').post(verifyJWT,logoutUser);
router.route('/refresh-token').post(verifyJWT, RefreshAccessToken);
router.post("/reset-password/:token", resetPassword);

export default router
