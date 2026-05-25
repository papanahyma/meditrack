import cron from "node-cron";
import moment from "moment-timezone";
import DoseLog from "../models/DoseLog.js";
import { sendEmail } from "../utils/sendEmail.js";
// import { sendSMS } from "../utils/sendSMS.js" // add when ready
// import { sendPush } from "../utils/sendPush.js" // add when ready

const TIMEZONE = 'Asia/Kolkata';

export const startReminderScheduler = () => {
  console.log('⏰ Reminder scheduler started with timezone:', TIMEZONE);
  
  cron.schedule("* * * * *", async () => {
    try {
      const now = moment().tz(TIMEZONE);
      
      // 1. EMAIL: 10 minutes before dose
      const emailWindowStart = now.clone().add(10, 'minutes').startOf('minute');
      const emailWindowEnd = emailWindowStart.clone().endOf('minute');

      // 2. ALARM/SMS/PUSH: Exact dose time
      const exactTimeStart = now.clone().startOf('minute');
      const exactTimeEnd = exactTimeStart.clone().endOf('minute');

      console.log(`--- ⏰ Heartbeat [${now.format('h:mm:ss A')}] ---`);
      console.log(`Email window: ${emailWindowStart.format('HH:mm')}`);
      console.log(`Exact window: ${exactTimeStart.format('HH:mm')}`);

      // === EMAIL REMINDERS T-10 ===
      const emailDoses = await DoseLog.find({
        status: "pending",
        emailSent: { $ne: true },
        scheduledTime: {
          $gte: emailWindowStart.toDate(),
          $lte: emailWindowEnd.toDate(),
        },
      }).populate("userId medicationId");

      for (let dose of emailDoses) {
        const userEmail = dose.userId.email;
        const medicineName = dose.medicationId.name || "Medicine";
        const doseTimeIST = moment(dose.scheduledTime).tz(TIMEZONE).format('h:mm A');

        await sendEmail({
          to: userEmail,
          subject: `Reminder in 10 min: Take ${medicineName}`,
          html: `
            <h2>Medicine Reminder 💊</h2>
            <p>Hi ${dose.userId.name || ''},</p>
            <p>Your dose is coming up in 10 minutes:</p>
            <h3>${medicineName}</h3>
            <p><strong>Time: ${doseTimeIST} IST</strong></p>
          `,
        });

        await DoseLog.findByIdAndUpdate(dose._id, { emailSent: true });
        console.log(`📧 Email sent: ${medicineName} to ${userEmail} for ${doseTimeIST}`);
      }

      // === EXACT TIME ALERTS T-0 ===
      const exactDoses = await DoseLog.find({
        status: "pending",
        alertSent: { $ne: true },
        scheduledTime: {
          $gte: exactTimeStart.toDate(),
          $lte: exactTimeEnd.toDate(),
        },
      }).populate("userId medicationId");

      for (let dose of exactDoses) {
        const medicineName = dose.medicationId.name || "Medicine";
        const doseTimeIST = moment(dose.scheduledTime).tz(TIMEZONE).format('h:mm A');

        // TODO: Trigger your alarm/SMS/push here
        // await sendSMS(dose.userId.phone, `Time to take ${medicineName}`);
        // await sendPush(dose.userId, `Time to take ${medicineName}`);
        
        await DoseLog.findByIdAndUpdate(dose._id, { alertSent: true });
        console.log(`🔔 Exact alert: ${medicineName} for ${doseTimeIST}`);
      }

    } catch (err) {
      console.log("❌ Scheduler error:", err.message);
    }
  });
};