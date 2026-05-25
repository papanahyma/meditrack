import User from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from 'crypto'
import nodemailer from 'nodemailer'

// TOKEN GENERATOR
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
})

transporter.verify((err) => {
  if (err) console.log('VERIFY ERROR:', err)
  else console.log('✅ Email server ready')
})

// ─── SEND REGISTER OTP (new — email must NOT exist yet) ────────
export const sendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email required' })

    // Block if a verified account already exists
    const exists = await User.findOne({ email, isVerified: true })
    if (exists) return res.status(400).json({ message: 'An account with this email already exists' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Remove any old pending entry for this email
    await User.deleteOne({ email, isVerified: false })

    // Store a placeholder so OTP survives until verify step
    await User.create({
      name: '__pending__',
      email,
      password: '__pending__',
      otpCode: otp,
      otpExpires: Date.now() + 5 * 60 * 1000,
      isVerified: false,
    })

    await transporter.sendMail({
      from: `"MediTrack" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your MediTrack account',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#0d9488;">Verify Your Email</h2>
          <p>Use the code below to complete your registration. It expires in <strong>5 minutes</strong>.</p>
          <div style="font-size:42px;font-weight:800;color:#0d9488;letter-spacing:10px;margin:24px 0;">${otp}</div>
          <p style="color:#6b7280;font-size:13px;">If you didn't request this, please ignore.</p>
        </div>
      `
    })

    res.json({ message: 'OTP sent to your email' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── REGISTER USER (updated — verifies OTP before creating) ───
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, otp } = req.body

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'All fields and OTP are required' })
    }

    // Find the pending placeholder matching the OTP
    const pending = await User.findOne({
      email,
      otpCode: otp,
      otpExpires: { $gt: Date.now() },
      isVerified: false,
    })

    if (!pending) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    // Clean up placeholder
    await User.deleteOne({ _id: pending._id })

    // Double-check no real account slipped in
    const alreadyExists = await User.findOne({ email, isVerified: true })
    if (alreadyExists) return res.status(400).json({ message: 'User already exists' })

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      isVerified: true,
    })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─── LOGIN USER ────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields required' })
    }

const user = await User.findOne({ email, isVerified: { $ne: false } })
    if (!user) return res.status(400).json({ message: 'User not found' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─── UPDATE PROFILE (protected) ───────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, phone, currentPassword, newPassword } = req.body

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (name) user.name = name
    if (phone !== undefined) user.phone = phone

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' })
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' })

      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(newPassword, salt)
    }

    await user.save()
    res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── FORGOT PASSWORD ───────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
const user = await User.findOne({ email, isVerified: { $ne: false } })
    if (!user) return res.status(404).json({ message: 'No account with that email' })

    const token = crypto.randomBytes(32).toString('hex')
    user.resetToken = token
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000
    await user.save()

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`

    await transporter.sendMail({
      from: `"MediTrack" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your MediTrack password',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#0d9488;">Password Reset Request</h2>
          <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#0d9488;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
            Reset Password
          </a>
          <p style="margin-top:24px;color:#6b7280;font-size:13px;">If you didn't request this, you can ignore this email.</p>
        </div>
      `
    })

    res.json({ message: 'Reset link sent to your email' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── RESET PASSWORD ────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    })

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link' })

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    user.resetToken = undefined
    user.resetTokenExpires = undefined
    await user.save()

    res.json({ message: 'Password reset successful' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── SEND LOGIN OTP ────────────────────────────────────────────
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body
const user = await User.findOne({ email, isVerified: { $ne: false } })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.otpCode = otp
    user.otpExpires = Date.now() + 5 * 60 * 1000
    await user.save()

    await transporter.sendMail({
      from: `"MediTrack" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your MediTrack Login Code',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#0d9488;">Login Verification Code</h2>
          <p>Use the code below to complete your sign in. It expires in <strong>5 minutes</strong>.</p>
          <div style="font-size:42px;font-weight:800;color:#0d9488;letter-spacing:10px;margin:24px 0;">${otp}</div>
          <p style="color:#6b7280;font-size:13px;">If you didn't request this, please ignore.</p>
        </div>
      `
    })

    res.json({ message: 'OTP sent to your email' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── VERIFY LOGIN OTP ──────────────────────────────────────────
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({
      email,
      otpCode: otp,
      otpExpires: { $gt: Date.now() }
    })

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' })

    user.otpCode = undefined
    user.otpExpires = undefined
    await user.save()

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id)
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
