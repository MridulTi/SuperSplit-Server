import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  sendOTP,
  verifyOTP,
} from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/sendotp").get(verifyJWT, sendOTP);
router.route("/verifyotp").post(verifyJWT, verifyOTP);

//secured routes   here verifyJWT is a middleware i.e before logout middleware will be executed
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refreshToken").post(refreshAccessToken);

export default router;
