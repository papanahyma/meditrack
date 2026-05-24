import dotenv from 'dotenv'
dotenv.config()

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({
      from: `"MediTrack" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    })

    console.log('📧 Email sent to:', to)
    return true
  } catch (err) {
    console.error('❌ Email error:', err.message)
    return false
  }
}