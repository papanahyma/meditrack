import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    role: { type: String, default: 'user' },
    isAdmin: { type: Boolean, default: false }, // ADD THIS LINE
    isVerified: { type: Boolean, default: false },
    
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    otpCode: { type: String },
    otpExpires: { type: Date },

    resetToken: { type: String },
    resetTokenExpires: { type: Date },

    phone: { type: String },

    streak: {
      count: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null } // Use Date type
    },

    pushSubscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String
      }
    }

  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)