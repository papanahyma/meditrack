import cron from "node-cron";
import moment from "moment-timezone";
import DoseLog from "../models/DoseLog.js";
import { sendEmail } from "../utils/sendEmail.js";

const TIMEZONE = 'Asia/Kolkata';

export const startReminderScheduler = () => {
  console.log('⏰ Reminder scheduler started with timezone:', TIMEZONE);
  
  cron.schedule("* * * * *", async () => {
    try {
      const now = moment().tz(TIMEZONE);
      const next15 = now.clone().add(15, 'minutes');

      console.log(`--- ⏰ Engine Heartbeat [${now.format('h:mm:ss A')}] ---`);
      console.log(`Checking meds between ${now.format('HH:mm')} - ${next15.format('HH:mm')} IST`);

      const dueDoses = await DoseLog.find({
        status: "pending",
        scheduledTime: {
          $gte: now.toDate(),
          $lte: next15.toDate(),
        },
      }).populate("userId medicationId");

      if (dueDoses.length === 0) {
        console.log('No doses due in next 15 min');
        return;
      }

      for (let dose of dueDoses) {
        const userEmail = dose.userId.email;
        const medicineName = dose.medicationId.name || "Medicine";
        const doseTimeIST = moment(dose.scheduledTime).tz(TIMEZONE).format('h:mm A');

        await sendEmail({
          to: userEmail,
          subject: `Reminder: Take ${medicineName}`,
          html: `
            <h2>Medicine Reminder 💊</h2>
            <p>Hi ${dose.userId.name || ''},</p>
            <p>You have a dose scheduled soon:</p>
            <h3>${medicineName}</h3>
            <p><strong>Time: ${doseTimeIST} IST</strong></p>
            <p>Stay healthy!</p>
          `,
        });

        console.log(`✅ Reminder sent: ${medicineName} to ${userEmail} for ${doseTimeIST}`);
        
        // Optional: mark as reminded so you don't spam
        // await DoseLog.findByIdAndUpdate(dose._id, { status: 'reminded' });
      }
    } catch (err) {
      console.log("❌ Scheduler error:", err.message);
    }
  });
};