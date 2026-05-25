import express from "express";
import DoseLog from "../models/DoseLog.js";
import { markAsTaken, markAsMissed } from "../controllers/doseLogController.js";

const router = express.Router();

router.put("/:doseLogId/taken", markAsTaken);
router.put("/:doseLogId/missed", markAsMissed);

// TEMP TEST ROUTE - takes userId + medicationId from body
router.post("/test-dose", async (req, res) => {
  try {
    const { userId, medicationId, minutesFromNow = 12 } = req.body;

    if (!userId || !medicationId) {
      return res.status(400).json({ 
        error: "userId and medicationId are required in request body" 
      });
    }

    // Auto set scheduledTime X minutes from now in UTC
    const scheduledTime = new Date(Date.now() + minutesFromNow * 60 * 1000);

    const dose = await DoseLog.create({
      userId,
      medicationId,
      scheduledTime,
      status: "pending",
      emailSent: false,
      alertSent: false
    });

    res.status(201).json({ 
      success: true, 
      message: `Test dose created for ${scheduledTime.toISOString()}`,
      dose 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;