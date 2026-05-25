import express from 'express'
import User from '../models/User.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/test', (req, res) => {
  res.json({ message: "Push route working" })
})

router.post('/subscribe', protect, async (req, res) => {
  console.log("SUBSCRIBE HIT")

  const { subscription } = req.body
  const userId = req.user._id

  if (!subscription) {
    return res.status(400).json({ message: "Missing subscription data" })
  }

  const user = await User.findById(userId)

  if (!user) return res.status(404).json({ message: "User not found" })

  user.pushSubscription = subscription
  await user.save()

  res.json({ message: "Subscribed successfully" })
})

export default router