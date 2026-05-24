import Medication from '../models/Medication.js'

export const snoozeMedication = async (req, res) => {
  try {
    const { medId, minutes } = req.body

    const snoozeUntil = new Date(
      Date.now() + minutes * 60 * 1000
    )

    await Medication.findByIdAndUpdate(medId, {
      isSnoozed: true,
      snoozedUntil: snoozeUntil,
      alarmSent: false
    })

    res.json({
      success: true,
      snoozedUntil: snoozeUntil
    })

  } catch (err) {
    console.log(err)

    res.status(500).json({
      message: 'Failed to snooze'
    })
  }
}