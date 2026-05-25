import Medication from '../models/Medication.js'
import User from '../models/User.js'
import { sendEmail } from "../utils/sendEmail.js"
import { updateDailyStreak } from '../services/streakService.js'
import { generateInsights } from '../services/aiInsights.js'
import PDFDocument from 'pdfkit'

/* ================= ADD ================= */
export const addMedication = async (req, res) => {
  try {
    const { userId, medicineName } = req.body
    if (!userId || !medicineName) {
      return res.status(400).json({ message: 'userId & medicineName required' })
    }
    const med = await Medication.create({
      ...req.body,
      emailSent: false,
      isActive: true,
      status: 'Pending',
    })
    return res.status(201).json({ success: true, medication: med })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/* ================= GET ================= */
export const getMedications = async (req, res) => {
  try {
    const { userId, admin } = req.query
    if (admin === 'true') {
      const meds = await Medication.find().sort({ createdAt: -1 })
      return res.status(200).json(meds)
    }
    if (!userId) return res.status(400).json({ message: 'userId required' })
    const meds = await Medication.find({ userId }).sort({ createdAt: -1 })
    return res.status(200).json({ success: true, medications: meds })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/* ================= DELETE ================= */
export const deleteMedication = async (req, res) => {
  try {
    const deleted = await Medication.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' })
    return res.status(200).json({ success: true, message: 'Deleted successfully' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/* ================= UPDATE ================= */
export const updateMedication = async (req, res) => {
  try {
    const updated = await Medication.findByIdAndUpdate(
      req.params.id, req.body, { returnDocument: 'after' }
    )
    if (!updated) return res.status(404).json({ success: false, message: 'Medication not found' })

    if (req.body.status === 'Taken' && updated.status === 'Taken') {
      const user = await User.findById(updated.userId)
      if (user) {
        const now = new Date()
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        const lastDate = user.streak?.lastActiveDate ? new Date(user.streak.lastActiveDate) : null
        if (lastDate) lastDate.setUTCHours(0, 0, 0, 0)
        const yesterday = new Date(today)
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)
        if (!user.streak) user.streak = { count: 0, lastActiveDate: null }
        if (!lastDate) user.streak.count = 1
        else if (lastDate.getTime() === today.getTime()) { /* already counted */ }
        else if (lastDate.getTime() === yesterday.getTime()) user.streak.count += 1
        else user.streak.count = 1
        user.streak.lastActiveDate = today
        await user.save()
        await Medication.findByIdAndUpdate(updated._id, {
          takenAt: now,
          $push: { statusHistory: { status: 'Taken', timestamp: now } }
        })
      }
    }

    if (updated.status === 'Missed') {
      await Medication.findByIdAndUpdate(updated._id, {
        $push: { statusHistory: { status: 'Missed', timestamp: new Date() } }
      })
    }

    if (updated.status === 'Taken' || updated.status === 'Missed') {
      await Medication.findByIdAndUpdate(updated._id, { emailSent: false })
    }

    return res.status(200).json({ success: true, medication: updated })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

/* ================= DASHBOARD STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId) return res.status(400).json({ message: 'userId required' })

    const meds = await Medication.find({ userId })
    const user = await User.findById(userId)

    const total = meds.length
    const taken = meds.filter(m => m.status === 'Taken').length
    const missed = meds.filter(m => m.status === 'Missed').length
    const pending = meds.filter(m => m.status === 'Pending').length
    const lowStock = meds.filter(m => m.inventory > 0 && m.inventory <= 5).length
    const adherence = total ? Math.round((taken / total) * 100) : 0

    let insights = []
    try { insights = generateInsights(meds) || [] } catch { insights = [] }

    const heatmapData = meds
      .filter(med => med.status === 'Taken' && med.takenAt)
      .reduce((acc, med) => {
        const date = new Date(med.takenAt)
        date.setUTCHours(0, 0, 0, 0)
        const dateStr = date.toISOString().split('T')[0]
        acc[dateStr] = (acc[dateStr] || 0) + 1
        return acc
      }, {})

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setUTCDate(d.getUTCDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      if (!heatmapData[dateStr]) heatmapData[dateStr] = 0
    }

    return res.status(200).json({
      success: true,
      total, taken, missed, pending, lowStock, adherence,
      medications: meds, insights,
      streak: user?.streak || { count: 0, lastActiveDate: null },
      heatmapData,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/* ================= LOGBOOK ================= */
// GET /api/medications/logbook?userId=xxx
export const getLogbook = async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId) return res.status(400).json({ message: 'userId required' })

    const meds = await Medication.find({ userId }).select(
      'medicineName dosage form reminderTime statusHistory takenAt status'
    )

    // Build a map: { 'YYYY-MM-DD': { taken: [...], missed: [...] } }
    const logbook = {}

    for (const med of meds) {
      // Include statusHistory entries
      for (const entry of med.statusHistory || []) {
        const date = new Date(entry.timestamp)
        date.setUTCHours(0, 0, 0, 0)
        const dateStr = date.toISOString().split('T')[0]
        if (!logbook[dateStr]) logbook[dateStr] = []
        logbook[dateStr].push({
          medId: med._id,
          medicineName: med.medicineName,
          dosage: med.dosage,
          form: med.form,
          reminderTime: med.reminderTime,
          status: entry.status,
          timestamp: entry.timestamp,
        })
      }

      // Also include current status if no history
      if ((med.statusHistory || []).length === 0 && med.takenAt) {
        const date = new Date(med.takenAt)
        date.setUTCHours(0, 0, 0, 0)
        const dateStr = date.toISOString().split('T')[0]
        if (!logbook[dateStr]) logbook[dateStr] = []
        logbook[dateStr].push({
          medId: med._id,
          medicineName: med.medicineName,
          dosage: med.dosage,
          form: med.form,
          reminderTime: med.reminderTime,
          status: med.status,
          timestamp: med.takenAt,
        })
      }
    }

    return res.status(200).json({ success: true, logbook })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

/* ================= SIDE EFFECTS ================= */
// POST /api/medications/:id/side-effects
export const addSideEffect = async (req, res) => {
  try {
    const { note, severity } = req.body
    if (!note) return res.status(400).json({ message: 'Note required' })

    const med = await Medication.findByIdAndUpdate(
      req.params.id,
      { $push: { sideEffects: { note, severity: severity || 'mild', loggedAt: new Date() } } },
      { new: true }
    )
    if (!med) return res.status(404).json({ message: 'Medication not found' })
    return res.status(201).json({ success: true, sideEffects: med.sideEffects })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// DELETE /api/medications/:id/side-effects/:effectId
export const deleteSideEffect = async (req, res) => {
  try {
    const med = await Medication.findByIdAndUpdate(
      req.params.id,
      { $pull: { sideEffects: { _id: req.params.effectId } } },
      { new: true }
    )
    return res.status(200).json({ success: true, sideEffects: med.sideEffects })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

/* ================= PDF EXPORT ================= */
// GET /api/medications/export-pdf?userId=xxx
export const exportPDF = async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId) return res.status(400).json({ message: 'userId required' })

    const meds = await Medication.find({ userId })
    const user = await User.findById(userId).select('name email')

    const total = meds.length
    const taken = meds.filter(m => m.status === 'Taken').length
    const missed = meds.filter(m => m.status === 'Missed').length
    const pending = meds.filter(m => m.status === 'Pending').length
    const adherence = total ? Math.round((taken / total) * 100) : 0

    const doc = new PDFDocument({ margin: 50 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="MediTrack_Report_${new Date().toISOString().split('T')[0]}.pdf"`)
    doc.pipe(res)

    // ── Header ─────────────────────────────────────────────────
    doc.fontSize(24).fillColor('#0d9488').font('Helvetica-Bold')
      .text('MediTrack Health Report', { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(11).fillColor('#6b7280').font('Helvetica')
      .text(`Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, { align: 'center' })
    doc.moveDown(0.5)

    // ── Patient Info ───────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke()
    doc.moveDown(0.5)
    doc.fontSize(13).fillColor('#111827').font('Helvetica-Bold').text('Patient Information')
    doc.moveDown(0.3)
    doc.fontSize(11).fillColor('#374151').font('Helvetica')
    doc.text(`Name: ${user?.name || 'N/A'}`)
    doc.text(`Email: ${user?.email || 'N/A'}`)
    doc.text(`Report Period: Last 30 days`)
    doc.moveDown(0.8)

    // ── Summary ────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke()
    doc.moveDown(0.5)
    doc.fontSize(13).fillColor('#111827').font('Helvetica-Bold').text('Adherence Summary')
    doc.moveDown(0.5)

    const summaryRows = [
      ['Total Medications', total],
      ['Doses Taken', taken],
      ['Doses Missed', missed],
      ['Doses Pending', pending],
      ['Adherence Rate', `${adherence}%`],
    ]

    for (const [label, value] of summaryRows) {
      doc.fontSize(11).font('Helvetica').fillColor('#6b7280').text(label, 60, doc.y, { continued: true, width: 250 })
      doc.fillColor('#111827').font('Helvetica-Bold').text(String(value), { align: 'right' })
    }

    doc.moveDown(0.8)

    // ── Adherence rating ───────────────────────────────────────
    const rating = adherence >= 80 ? '✓ Excellent' : adherence >= 50 ? '~ Good' : '✗ Needs Improvement'
    const ratingColor = adherence >= 80 ? '#10b981' : adherence >= 50 ? '#f59e0b' : '#ef4444'
    doc.fontSize(12).fillColor(ratingColor).font('Helvetica-Bold')
      .text(`Overall Rating: ${rating}`, { align: 'center' })
    doc.moveDown(0.8)

    // ── Medication List ────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke()
    doc.moveDown(0.5)
    doc.fontSize(13).fillColor('#111827').font('Helvetica-Bold').text('Medication Details')
    doc.moveDown(0.5)

    for (const med of meds) {
      // Check if we need a new page
      if (doc.y > 680) doc.addPage()

      const statusColor = med.status === 'Taken' ? '#10b981' : med.status === 'Missed' ? '#ef4444' : '#f59e0b'

      doc.fontSize(12).fillColor('#0d9488').font('Helvetica-Bold').text(`• ${med.medicineName}`)
      doc.fontSize(10).fillColor('#374151').font('Helvetica')
      doc.text(`  Dosage: ${med.dosage}  |  Form: ${med.form}`, { indent: 10 })
      if (med.reminderTime) doc.text(`  Reminder: ${med.reminderTime}`, { indent: 10 })
      if (med.instructions) doc.text(`  Instructions: ${med.instructions}`, { indent: 10 })
      doc.fillColor(statusColor).text(`  Status: ${med.status}`, { indent: 10 })
      doc.fillColor('#374151').text(`  Inventory: ${med.inventory} remaining`, { indent: 10 })

      // Side effects
      if (med.sideEffects && med.sideEffects.length > 0) {
        doc.fillColor('#6b7280').text(`  Side Effects Logged: ${med.sideEffects.length}`, { indent: 10 })
        for (const se of med.sideEffects.slice(0, 3)) {
          const seColor = se.severity === 'severe' ? '#ef4444' : se.severity === 'moderate' ? '#f59e0b' : '#6b7280'
          doc.fillColor(seColor).text(`    - ${se.note} (${se.severity}) — ${new Date(se.loggedAt).toLocaleDateString()}`, { indent: 10 })
        }
      }

      doc.moveDown(0.5)
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#f3f4f6').stroke()
      doc.moveDown(0.3)
    }

    // ── Footer ─────────────────────────────────────────────────
    doc.moveDown(1)
    doc.fontSize(9).fillColor('#9ca3af').font('Helvetica')
      .text('This report is generated by MediTrack. Please consult your doctor for medical advice.', { align: 'center' })

    doc.end()
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ================= MANUAL EMAIL ================= */
export const sendReminder = async (req, res) => {
  try {
    const { email, medicineName, dosage, form, reminderTime, userEmail } = req.body
    const to = userEmail || email
    if (!to || !medicineName) return res.status(400).json({ message: 'email and medicineName are required' })
    await sendEmail({
      to,
      subject: `Reminder: Take ${medicineName} in 10 minutes`,
      html: `<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:30px;">
        <div style="max-width:500px;margin:auto;background:white;border-radius:12px;padding:30px;">
          <h2 style="color:#0d9488;">MediTrack Reminder</h2>
          <p>It's almost time to take <strong>${medicineName}</strong>.</p>
          ${dosage ? `<p>Dosage: ${dosage}</p>` : ''}
          ${reminderTime ? `<p>Scheduled: <strong>${reminderTime}</strong></p>` : ''}
        </div>
      </div>`
    })
    return res.json({ message: 'Reminder email sent' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

/* ================= USER DETAILS ================= */
export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -otpCode -otpExpires -resetToken -resetTokenExpires')
  if (!user) return res.status(404).json({ message: 'User not found' })
  const medications = await Medication.find({ userId: req.params.id }).sort({ createdAt: -1 })
  res.json({ user, medications })
}
