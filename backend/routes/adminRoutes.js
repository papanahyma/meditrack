import express from 'express'
import { getAllUsers, deleteUser, toggleAdmin, getStats, getUserById } from '../controllers/adminController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

console.log("ADMIN ROUTES IMPORT STARTED")

router.get('/test', (req, res) => {
  res.send('ADMIN ROUTE WORKING')
})

router.get('/users', protect, admin, getAllUsers)
router.get('/stats', protect, admin, getStats)
router.put('/users/:id', protect, admin, toggleAdmin)
router.delete('/users/:id', protect, admin, deleteUser)
router.get('/users/:id', protect, admin, getUserById)

export default router