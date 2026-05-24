import express from "express"
import drugInfo from "../data/drugInfo.js"
import interactions from "../data/drugInteractions.js"
import Medication from "../models/Medication.js"

const router = express.Router()

router.post("/analyze", async (req, res) => {

  try {

    const { medicineName, userId } = req.body

    const medKey = medicineName.toLowerCase()

    // Drug info
    const info = drugInfo[medKey]

    // Existing meds
    const existingMeds = await Medication.find({ userId })

    const warnings = []

    existingMeds.forEach(med => {

      interactions.forEach(interaction => {

        if (
          interaction.drugs.includes(med.name?.toLowerCase()) &&
          interaction.drugs.includes(medKey)
        ) {
          warnings.push(interaction.warning)
        }

      })

    })

    res.json({
      success: true,
      medicineInfo: info || null,
      interactionWarnings: warnings
    })

  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      message: "AI analysis failed"
    })
  }

})

export default router