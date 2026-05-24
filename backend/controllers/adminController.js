import User from '../models/User.js'
import Medication from '../models/Medication.js'

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password -otpCode -otpExpires -resetToken -resetTokenExpires')
    res.json({ users }) // ADD THE { } WRAPPER HERE
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    
    // Only block deleting yourself, not other admins
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' })
    }

    // Delete user's medications too
    await Medication.deleteMany({ user: req.params.id })
    await user.deleteOne()
    
    res.json({ message: 'User removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// MISSING - Add this one
export const toggleAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Can't toggle your own admin status
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own admin status' })
    }

    user.isAdmin = !user.isAdmin
    user.role = user.isAdmin ? 'admin' : 'user'
    
    const updatedUser = await user.save()
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      role: updatedUser.role
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments()
    const adminCount = await User.countDocuments({ isAdmin: true })
    const medCount = await Medication.countDocuments()
    
    // Active users in last 7 days - only works after you fix streak to Date type
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const activeUsers = await User.countDocuments({
      'streak.lastActiveDate': { $gte: sevenDaysAgo }
    })

    res.json({ 
      users: userCount, 
      admins: adminCount,
      medications: medCount,
      activeUsers 
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/admin/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otpCode -otpExpires -resetToken -resetTokenExpires')
    if (!user) return res.status(404).json({ message: 'User not found' })

    const medications = await Medication.find({ userId: req.params.id }).sort({ createdAt: -1 })

    res.json({ user, medications })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}