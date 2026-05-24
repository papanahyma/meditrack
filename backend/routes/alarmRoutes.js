import express from 'express'
import { snoozeMedication } from '../controllers/alarmController.js'

const router = express.Router()

router.post('/snooze', snoozeMedication)

router.post('/status', async (req, res) => {

  const { medId, status } = req.body

  const med = await Medication.findById(medId)

  if (!med) {
    return res.status(404).json({
      message: 'Medication not found'
    })
  }

  med.history.push({
    status,
    time: new Date()
  })

  await med.save()

  res.json({
    message: 'Status updated'
  })
})

// MARK AS TAKEN
router.post('/taken', async (req, res) => {

  try {

    const { medId } = req.body

    const med = await Medication.findById(medId)

    if (!med) {
      return res.status(404).json({
        message: 'Medication not found'
      })
    }

    med.status = 'taken'
    med.takenAt = new Date()
    med.isSnoozed = false
    med.snoozedUntil = null

    med.inventory = Math.max(
      0,
      med.inventory - 1
    )

    await med.save()

    res.json({ success: true })

  } catch (err) {

    console.log(err)

    res.status(500).json({
      message: 'Server error'
    })

  }

})

// MARK AS SKIPPED
router.post('/Missed', async (req, res) => {
  try {

    const { medId } = req.body

    await Medication.findByIdAndUpdate(medId, {
      status: 'missed',
      isSnoozed: false,
      snoozedUntil: null
    })

    res.json({ success: true })

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Server error' })
  }
})


export default router