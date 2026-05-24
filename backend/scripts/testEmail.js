import dotenv from 'dotenv'
dotenv.config({ path: './.env' })   

import { sendEmail } from '../utils/sendEmail.js'

const run = async () => {
  console.log("EMAIL_USER:", process.env.EMAIL_USER)
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "OK" : "MISSING")

  const result = await sendEmail({
    to: process.env.EMAIL_USER,
    subject: '🧪 Test Email',
    text: 'If this works, email is fixed',
  })

  console.log('EMAIL RESULT:', result)
}

run()