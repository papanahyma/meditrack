import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    family: 4, // Force IPv4 - fixes ENETUNREACH on Render free tier
    tls: {
      rejectUnauthorized: false // Bypass Render SSL issues
    }
  })
}

export default createTransporter