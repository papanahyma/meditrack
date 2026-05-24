import express from 'express'
import Medication from '../models/Medication.js'
import upload from '../middleware/uploadMiddleware.js'

import {
  addMedication,
  getMedications,
  deleteMedication,
  updateMedication,
  getDashboardStats,
  sendReminder,
  getLogbook,
  addSideEffect,
  deleteSideEffect,
  exportPDF,
} from '../controllers/medicationController.js'

const router = express.Router()

// ── Core CRUD ──────────────────────────────────────────────────
router.post('/add', addMedication)
router.get('/', getMedications)
router.delete('/:id', deleteMedication)
router.put('/:id', updateMedication)

// ── Dashboard ──────────────────────────────────────────────────
router.get('/dashboard/stats', getDashboardStats)

// ── Reminder email ─────────────────────────────────────────────
router.post('/remind', sendReminder)

// ── Logbook (calendar) ─────────────────────────────────────────
router.get('/logbook', getLogbook)

// ── PDF export ─────────────────────────────────────────────────
router.get('/export-pdf', exportPDF)

// ── Side effects ───────────────────────────────────────────────
router.post('/:id/side-effects', addSideEffect)
router.delete('/:id/side-effects/:effectId', deleteSideEffect)

// ── Prescription upload ────────────────────────────────────────
router.post('/upload-prescription/:id', upload.single('prescription'), async (req, res) => {
  try {
    const med = await Medication.findById(req.params.id)
    if (!med) return res.status(404).json({ message: 'Medication not found' })
    med.prescriptionImage = `/uploads/${req.file.filename}`
    await med.save()
    res.json({ message: 'Prescription uploaded', imageUrl: med.prescriptionImage })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── User medications (for profile page) ───────────────────────
router.get('/user/:id', async (req, res) => {
  try {
    const medications = await Medication.find({ userId: req.params.id }).sort({ createdAt: -1 })
    res.json({ medications })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router