import express from "express";
import {
  registerUser, loginUser,
  forgotPassword, resetPassword,
  sendOtp, verifyOtp, sendRegisterOtp,updateProfile
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router();

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.post('/send-otp', sendOtp)
router.post('/verify-otp', verifyOtp)
router.post('/send-register-otp', sendRegisterOtp)
router.put('/update-profile', protect, updateProfile)

export default router;