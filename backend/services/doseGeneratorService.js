import DoseLog from "../models/DoseLog.js";

/**
 * Generate dose logs when a medication is created
 */



export const generateDoseLogs = async (medication) => {
  console.log("🔥 generateDoseLogs called");

  console.log("MEDICATION RECEIVED:", JSON.stringify(medication, null, 2));

  const logs = [];

  const startDate = new Date(medication.startDate);
  const endDate = medication.endDate ? new Date(medication.endDate) : null;

  const formatDate = (d) => d.toISOString().split("T")[0];

  // 🔴 SAFETY CHECK
  if (!medication.schedule || !medication.schedule.type) {
    console.log("❌ INVALID OR MISSING SCHEDULE");
    return;
  }

  // FIX: safe times
  const times = Array.isArray(medication.schedule.times)
    ? medication.schedule.times
    : [];

  if (medication.schedule.type === "fixed_times") {
    let current = new Date(startDate);

    while (!endDate || current <= endDate) {
      times.forEach((time) => {
        const [hours, minutes] = time.split(":");

        const scheduled = new Date(current);
        scheduled.setHours(hours, minutes, 0, 0);

        logs.push({
          userId: medication.userId,
          medicationId: medication._id,
          scheduledTime: scheduled,
          status: "pending",
          date: formatDate(current),
        });
      });

      current.setDate(current.getDate() + 1);
    }
  }

  if (medication.schedule.type === "interval") {
    let current = new Date(startDate);

    while (!endDate || current <= endDate) {
      logs.push({
        userId: medication.userId,
        medicationId: medication._id,
        scheduledTime: new Date(current),
        status: "pending",
        date: formatDate(current),
      });

      current.setHours(current.getHours() + medication.schedule.intervalHours);
    }
  }

  if (medication.schedule.type === "alternate_days") {
    let current = new Date(startDate);
    let toggle = true;

    while (!endDate || current <= endDate) {
      if (toggle) {
        times.forEach((time) => {
          const [h, m] = time.split(":");

          const scheduled = new Date(current);
          scheduled.setHours(h, m, 0, 0);

          logs.push({
            userId: medication.userId,
            medicationId: medication._id,
            scheduledTime: scheduled,
            status: "pending",
            date: formatDate(current),
          });
        });
      }

      toggle = !toggle;
      current.setDate(current.getDate() + 1);
    }
  }

  if (logs.length > 0) {
    await DoseLog.insertMany(logs);
    console.log("✅ DoseLogs inserted:", logs.length);
  } else {
    console.log("⚠️ No logs generated");
  }
};