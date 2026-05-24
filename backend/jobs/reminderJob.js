import cron from 'node-cron'
import webpush from 'web-push'
import Medication from '../models/Medication.js'
import User from '../models/User.js'
import { sendEmail } from '../services/emailService.js'

webpush.setVapidDetails(
  'mailto:' + process.env.EMAIL_USER,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const parseTime = (time) => {
  if (!time) return { hour: -1, minute: -1 }
  const parts = time.trim().split(/\s+/)
  const [t, meridian] = parts
  let [hour, minute] = t.split(':').map(Number)
  if (meridian) {
    const m = meridian.toUpperCase()
    if (m === 'PM' && hour !== 12) hour += 12
    if (m === 'AM' && hour === 12) hour = 0
  }
  return { hour, minute }
}

export const runReminderEngine = async () => {
  try {
    const now = new Date()
    // 10 minutes ahead for advance reminder
    const target = new Date(now.getTime() + 10 * 60 * 1000)
    const targetHour = target.getHours()
    const targetMinute = target.getMinutes()

    console.log(`--- ⏰ Engine Heartbeat [${now.toLocaleTimeString()}] ---`)
    console.log(`Checking for meds at: ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')} | 10-min ahead: ${targetHour}:${String(targetMinute).padStart(2,'0')}`)

    // Batch load all users to avoid N+1 queries
    const meds = await Medication.find({ isActive: true })
    const userIds = [...new Set(meds.map(m => m.userId?.toString()).filter(Boolean))]
    const users = await User.find({ _id: { $in: userIds } })
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]))

    for (const med of meds) {
      if (!med.reminderTime) continue

      const { hour, minute } = parseTime(med.reminderTime)
      const user = userMap[med.userId?.toString()]

      if (!user) {
        console.log(`❌ User not found for med: ${med.medicineName}`)
        continue
      }

      // ── SNOOZE CHECK ──────────────────────────────────────────
      if (med.isSnoozed && med.snoozedUntil && new Date() >= med.snoozedUntil) {
        med.isSnoozed = false
        med.snoozedUntil = null
        await med.save()
        console.log(`⏰ Snooze ended for ${med.medicineName} — alarm will re-fire`)
      }

      // ── LOW STOCK ALERT ───────────────────────────────────────
      if (med.inventory <= med.lowStockThreshold && !med.lowStockAlertSent) {
        console.log(`⚠️ LOW STOCK ALERT: ${med.medicineName}`)

        if (user.pushSubscription) {
          webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify({
              title: '⚠️ Low Stock Alert',
              body: `${med.medicineName} is running low (${med.inventory} left)`
            })
          ).catch(() => console.log('Low stock push failed'))
        }

        await sendEmail({
          to: user.email,
          subject: `Low Stock Alert: ${med.medicineName}`,
          html: `<div style="font-family:sans-serif;padding:20px">
            <h2 style="color:#ef4444">Low Stock Alert</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p><strong>${med.medicineName}</strong> is running low.</p>
            <p><strong>Remaining:</strong> ${med.inventory} pill(s)</p>
          </div>`
        })

        med.lowStockAlertSent = true
        await med.save()
      }

      // Reset low stock flag when restocked
      if (med.inventory > med.lowStockThreshold && med.lowStockAlertSent) {
        med.lowStockAlertSent = false
        await med.save()
        console.log(`✅ Low stock reset for ${med.medicineName}`)
      }

      // ── LOGIC A: 10-MIN ADVANCE EMAIL + PUSH ─────────────────
      // Fires when med time matches 10 MINUTES FROM NOW (uses targetHour/targetMinute)
      if (hour === targetHour && minute === targetMinute && !med.emailSent) {
        console.log(`🎯 10-min advance reminder for: ${med.medicineName}`)

        if (user.pushSubscription) {
          webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify({
              title: '💊 Medicine Reminder',
              body: `Time to take ${med.medicineName} in 10 minutes`,
            })
          ).catch(err => {
            console.log('10-min push error:', err.statusCode)
            if (err.statusCode === 410) {
              User.findByIdAndUpdate(user._id, { $unset: { pushSubscription: 1 } })
            }
          })
        }

        const result = await sendEmail({
          to: user.email,
          subject: `MediTrack Reminder: ${med.medicineName}`,
          html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #0d9488;border-radius:10px">
            <h2 style="color:#0d9488">Medicine Reminder — 10 Minutes</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>It's almost time to take your medication.</p>
            <hr/>
            <p><strong>Medicine:</strong> ${med.medicineName}</p>
            <p><strong>Dosage:</strong> ${med.dosage}</p>
            <p><strong>Scheduled Time:</strong> ${med.reminderTime}</p>
          </div>`,
        })

        if (result) {
          med.emailSent = true
          await med.save()
          console.log(`📧 Email sent to ${user.email}`)
        }
      }

      // ── LOGIC A2: EXACT TIME ALARM ────────────────────────────
      // Fires when med time matches RIGHT NOW (uses now.getHours/Minutes)
      if (
        hour === now.getHours() &&
        minute === now.getMinutes() &&
        !med.alarmSent &&
        !med.isSnoozed
      ) {
        console.log(`🔔 EXACT TIME ALARM for: ${med.medicineName}`)

        // Push notification
        if (user.pushSubscription) {
          webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify({
              title: '⏰ TAKE MEDICINE NOW',
              body: `${med.medicineName} — ${med.dosage}`,
              medId: String(med._id)
            })
          ).then(() => {
            console.log(`✅ Alarm push sent to ${user.email}`)
          }).catch(err => {
            console.log('❌ Alarm push failed:', err.statusCode)
            if (err.statusCode === 410) {
              User.findByIdAndUpdate(user._id, { $unset: { pushSubscription: 1 } })
            }
          })
        } else {
          console.log(`⚠️ No push subscription for: ${user.email}`)
        }

        // n8n SMS via Twilio
        if (user.phone) {
          fetch('https://meditrack.app.n8n.cloud/webhook/medicine-alarm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: user.phone,
              medicineName: med.medicineName
            })
          }).then(() => {
            console.log(`📱 SMS triggered for ${user.phone}`)
          }).catch(err => {
            console.log('❌ n8n SMS failed:', err.message)
          })
        }

        // Decrease inventory by 1 when alarm fires
        if (med.inventory > 0) {
          med.inventory -= 1
        }

        med.alarmSent = true
        await med.save()
      }

      // ── REFILL DATE REMINDER ──────────────────────────────────
      if (med.refillDate) {
        const refill = new Date(med.refillDate)
        const today = new Date()
        // Fire on the exact refill date (same day)
        if (
          refill.getFullYear() === today.getFullYear() &&
          refill.getMonth() === today.getMonth() &&
          refill.getDate() === today.getDate() &&
          !med.refillReminderSent
        ) {
          console.log(`💊 REFILL REMINDER: ${med.medicineName}`)

          await sendEmail({
            to: user.email,
            subject: `Refill Reminder: ${med.medicineName}`,
            html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #0d9488;border-radius:10px">
              <h2 style="color:#0d9488">Refill Reminder</h2>
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>Today is your scheduled refill date for <strong>${med.medicineName}</strong>.</p>
              <p>Please contact your doctor or pharmacy to refill your prescription.</p>
            </div>`
          })

          if (user.pushSubscription) {
            webpush.sendNotification(
              user.pushSubscription,
              JSON.stringify({
                title: '💊 Refill Reminder',
                body: `Time to refill ${med.medicineName}`
              })
            ).catch(() => {})
          }

          med.refillReminderSent = true
          await med.save()
        }
      }

      // ── LOGIC B: RESET FLAGS (safe midnight rollover) ─────────
      const prevMinute = now.getMinutes() === 0 ? 59 : now.getMinutes() - 1
      const prevHour = now.getMinutes() === 0
        ? (now.getHours() === 0 ? 23 : now.getHours() - 1)
        : now.getHours()

      if (hour === prevHour && minute === prevMinute) {
        if (med.emailSent || med.alarmSent) {
          med.emailSent = false
          med.alarmSent = false
          await med.save()
          console.log(`♻️ Reset flags for ${med.medicineName}`)
        }
      }

    } // end for loop

  } catch (err) {
    console.error('❌ Reminder Engine Error:', err.message)
  }
}

const startReminderJob = () => {
  cron.schedule('* * * * *', () => {
    runReminderEngine()
  })
  console.log('🚀 Automated Reminder Engine initialized.')
}

export default startReminderJob
