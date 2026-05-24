import Medication from '../models/Medication.js'
import User from '../models/User.js'
import { sendEmail } from '../utils/sendEmail.js'

const parseTime = (time) => {
  const [t, meridian] = time.trim().split(' ')

  let [hour, minute] = t.split(':').map(Number)

  // Convert to 24-hour format
  if (meridian === 'PM' && hour !== 12) {
    hour += 12
  }

  if (meridian === 'AM' && hour === 12) {
    hour = 0
  }

  return { hour, minute }
}

export const runReminderEngine = async () => {
  try {
    const now = new Date()

    // Check 10 mins before
    const target = new Date(now.getTime() + 10 * 60 * 1000)

    const targetHour = target.getHours()
    const targetMinute = target.getMinutes()

    console.log(
      `Checking reminders for ${targetHour}:${String(targetMinute).padStart(2, '0')}`
    )

    const meds = await Medication.find({
      isActive: true,
      emailSent: false,
    })

    for (const med of meds) {

      if (!med.reminderTime) continue

      const { hour, minute } = parseTime(med.reminderTime)

      // ONLY match correct reminder time
      if (hour !== targetHour || minute !== targetMinute) {
        continue
      }

      console.log('✅ MATCH FOUND')
      console.log('Medicine:', med.medicineName)
      console.log('Reminder:', med.reminderTime)

      const user = await User.findById(med.userId)

      if (!user) {
        console.log('❌ User not found')
        continue
      }

      const result = await sendEmail({
        to: user.email,
        subject: `Reminder: ${med.medicineName}`,
        html: `
          <h2>MediTrack Reminder</h2>
          <p>Hi ${user.name},</p>
          <p>Time to take your medicine:</p>

          <div style="padding:15px;border:1px solid #ddd;border-radius:10px">
            <h3>${med.medicineName}</h3>
            <p><strong>Dosage:</strong> ${med.dosage}</p>
            <p><strong>Time:</strong> ${med.reminderTime}</p>
          </div>

          <p>Please take it on time 💊</p>
        `,
      })

      if (result) {
        med.emailSent = true
        await med.save()

        console.log(`📧 Email sent to ${user.email}`)
      }
    }

  } catch (err) {
    console.error('Reminder Engine Error:', err.message)
  }
}