import mongoose from 'mongoose'

const medicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    medicineName: {
      type: String,
      required: true,
    },

    prescriptionImage: {
      type: String,
      default: ''
    },

    refillDate: {
      type: Date
    },

    dosage: {
      type: String,
      required: true,
    },

    form: {
      type: String,
      required: true,
    },

    instructions: {
      type: String,
    },

    inventory: {
      type: Number,
      default: 0,
    },

    // ── Scheduling ────────────────────────────────────────────
    reminderTime: {
      type: String,
    },

    // ✅ NEW: Complex scheduling
    scheduleType: {
      type: String,
      enum: ['once', 'interval', 'multiple', 'alternate'],
      default: 'once'
    },

    reminderTimes: {
      type: [String],
      default: []
    },

    intervalHours: {
      type: Number,
    },

    startTime: {
      type: String,
    },

    alternateDays: {
      type: Boolean,
      default: false
    },

    lastAlternateDate: {
      type: Date,
    },

    // ── Status ────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Pending', 'Taken', 'Missed'],
      default: 'Pending',
    },

    emailSent: {
      type: Boolean,
      default: false,
    },

    alarmSent: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    takenAt: {
      type: Date,
      default: null
    },

    // ── History ───────────────────────────────────────────────
    statusHistory: [{
      status: String,
      timestamp: { type: Date, default: Date.now }
    }],

    history: [{
      status: String, // taken, skipped, snoozed
      time: Date
    }],

    // ── Snooze ────────────────────────────────────────────────
    isSnoozed: {
      type: Boolean,
      default: false
    },

    snoozedUntil: {
      type: Date,
      default: null
    },

    // ── Low stock ─────────────────────────────────────────────
    lowStockThreshold: {
      type: Number,
      default: 5
    },

    lowStockAlertSent: {
      type: Boolean,
      default: false
    },

    // ── Refill ────────────────────────────────────────────────
    refillReminderSent: {
      type: Boolean,
      default: false
    },

    // ── Prescription ──────────────────────────────────────────
    prescriptionFile: {
      type: String,
      default: ''
    },

    // ✅ NEW: Side effects log
    sideEffects: [{
      note: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild'
      },
      loggedAt: {
        type: Date,
        default: Date.now
      }
    }],

  },

  { timestamps: true }
)

const Medication = mongoose.model(
  'Medication',
  medicationSchema
)

export default Medication
