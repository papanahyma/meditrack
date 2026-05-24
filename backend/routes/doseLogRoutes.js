import express from "express";
import { markAsTaken, markAsMissed } from "../controllers/doseLogController.js";

const router = express.Router();

router.put("/:doseLogId/taken", markAsTaken);
router.put("/:doseLogId/missed", markAsMissed);

export default router;