import express from "express";
import drugInfo from "../data/drugInfo.js";
import interactions from "../data/drugInteractions.js";
import Medication from "../models/Medication.js";

const router = express.Router();

router.post("/analyze", async (req, res) => {
    console.log("🔥 HIT /analyze endpoint");
    console.log("Request body:", req.body);

    try {
        const { medicineName, userId } = req.body;

        // 1. Validate required field
        if (!medicineName || typeof medicineName!== "string" ||!medicineName.trim()) {
            return res.status(400).json({
                success: false,
                message: "medicineName is required and must be a non-empty string"
            });
        }

        const medKey = medicineName.trim().toLowerCase();

        // 2. Get drug info from local data
        const info = drugInfo[medKey];

        // 3. Only check interactions if userId is provided
        let warnings = [];
        let checkedInteractions = false;

        if (userId) {
            checkedInteractions = true;
            const existingMeds = await Medication.find({ userId });

            existingMeds.forEach(med => {
                if (!med.name) return; // skip meds with no name

                interactions.forEach(interaction => {
                    const med1 = med.name.toLowerCase();
                    const med2 = medKey;

                    if (
                        interaction.drugs.includes(med1) &&
                        interaction.drugs.includes(med2)
                    ) {
                        // Avoid duplicate warnings
                        if (!warnings.includes(interaction.warning)) {
                            warnings.push(interaction.warning);
                        }
                    }
                });
            });
        }

        // 4. Send response
        res.json({
            success: true,
            medicineInfo: info || null,
            interactionWarnings: warnings,
            checkedInteractions,
            message: info? "Drug info found" : `No info found for "${medicineName}" in database`
        });

    } catch (error) {
        console.error("❌ DRUG LOOKUP ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Drug lookup failed"
        });
    }
});

export default router;