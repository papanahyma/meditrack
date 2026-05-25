import axios from 'axios'

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.N8N_EMAIL_WEBHOOK_URL) {
      console.error('❌ N8N_EMAIL_WEBHOOK_URL missing in Render env')
      return false
    }

    const payload = {
      to,
      subject,
      text: text || '',
      html: html || text || ''
    }

    await axios.post(process.env.N8N_EMAIL_WEBHOOK_URL, payload, { 
      timeout: 10000 
    })

    console.log(`📧 Email sent via n8n to ${to}`)
    return true
  } catch (err) {
    console.error('❌ n8n email error:', err.response?.data || err.message)
    return false
  }
}