import createTransporter from '../utils/emailConfig.js'

const transporter = createTransporter()

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Missing EMAIL credentials in .env')
    }

    await transporter.sendMail({
      from: `"MediTrack" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    })

    console.log(`📧 Email sent to ${to}`)
    return true
  } catch (err) {
    console.error('❌ Email error:', err.message)
    return false
  }
}

export default sendEmail