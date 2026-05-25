import mongoose from "mongoose";

const doseLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
      required: true,
    },

    scheduledTime: {
      type: Date,
      required: true,
    },

    takenTime: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "taken", "missed", "skipped"],
      default: "pending",
    },

    date: {
      type: String,
      required: true, // YYYY-MM-DD
    },

    // NEW: Track notifications
    emailSent: {
      type: Boolean,
      default: false,
    },
    
    alertSent: {
      type: Boolean,
      default: false, // for SMS/push/alarm at exact time
    },
  },
  {
    timestamps: true,
  }
);

const DoseLog = mongoose.model("DoseLog", doseLogSchema);

export default DoseLog;