import cron from "node-cron";
import DoseLog from "../models/DoseLog.js";
import sendEmail from "./emailService.js";

export const startReminderScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const next15 = new Date();
      next15.setMinutes(now.getMinutes() + 15);

      const dueDoses = await DoseLog.find({
        status: "pending",
        scheduledTime: {
          $gte: now,
          $lte: next15,
        },
      }).populate("userId medicationId");

      for (let dose of dueDoses) {
        const userEmail = dose.userId.email;
        const medicineName = dose.medicationId.name || "Medicine";

        await sendEmail({
          to: userEmail,
          subject: `Reminder: Take ${medicineName}`,
          html: `
            <h2>Medicine Reminder</h2>
            <p>You have a dose scheduled soon:</p>
            <b>${medicineName}</b>
            <p>Time: ${dose.scheduledTime}</p>
          `,
        });

        console.log("Reminder sent:", dose._id);
      }
    } catch (err) {
      console.log("Scheduler error:", err.message);
    }
  });
};