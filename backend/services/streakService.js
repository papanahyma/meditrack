import User from '../models/User.js'
import Medication from '../models/Medication.js'

export const updateDailyStreak = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (!user) return

    const meds = await Medication.find({ userId })
    if (meds.length === 0) return

    const allTaken = meds.every(m => m.status === 'Taken')
    const today = new Date().toDateString()

    if (!user.streak) {
      user.streak = { count: 0, lastActiveDate: null }
    }

    const last = user.streak.lastActiveDate

    if (!last) {
      user.streak.count = allTaken ? 1 : 0
    } else {
      const diff =
        (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24)

      if (diff === 1 && allTaken) {
        user.streak.count += 1
      } else if (!allTaken || diff > 1) {
        user.streak.count = 0
      }
    }

    user.streak.lastActiveDate = today
    await user.save()

  } catch (err) {
    console.error('Streak update error:', err.message)
  }
}