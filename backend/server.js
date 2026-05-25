import dotenv from 'dotenv'
dotenv.config()

import cors from 'cors';
import express from 'express'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import medicationRoutes from './routes/medicationRoutes.js'
import startReminderJob from './jobs/reminderJob.js'
import pushRoutes from './routes/pushRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import cron from 'node-cron';
import webpush from 'web-push'
import Medication from './models/Medication.js'
import User from './models/User.js'
import { sendEmail } from "./utils/sendEmail.js"
import alarmRoutes from './routes/alarmRoutes.js'
import path from 'path'
import doseLogRoutes from "./routes/doseLogRoutes.js";
import { startReminderScheduler } from "./services/reminderScheduler.js";
import drugRoutes from "./routes/drugRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js";
import medicineAIRoutes from "./routes/medicineAIRoutes.js"

const app = express()

console.log("🔥 SERVER.JS IS RUNNING")

webpush.setVapidDetails(
  'mailto:leylahpapana@gmail.com', // MODIFIED: Use real email
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)


// CORS

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://meditrack-ruddy.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        // Allow your main domain + any Vercel preview deployment
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// Routes
app.use('/api/auth', authRoutes)
app.use('/api/medications', medicationRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/alarm', alarmRoutes)
app.use('/api/uploads', express.static('uploads'))
app.use("/api/dose", doseLogRoutes);
app.use("/api/drugs", drugRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/medicine-ai", medicineAIRoutes)

app.use("/api/uploads", express.static("uploads"));

app.get('/', (req, res) => {
  res.send('MediTrack Backend Running')
})

app.get('/vapid-public-key', (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY)
})

app.post('/save-subscription', async (req, res) => {
  await User.updateOne(
    { _id: req.user._id }, // use your auth middleware to get user
    { $set: { pushSubscription: req.body.subscription } }
  )
  res.json({ success: true })
})

const PORT = process.env.PORT || 5001



connectDB()
  .then(() => {
    console.log('MongoDB Connected')
    startReminderJob() // MODIFIED: Kept this since you had it
    console.log("ROUTES LOADED: /api/push, /api/auth, /api/medications, /api/admin, /api/medicine-ai, /api/dose, /api/drugs, /api/ocr, /api/upload, /api/alarm")
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)

      startReminderScheduler();
    })
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message)
    process.exit(1)
  })

console.log("EMAIL_USER =", process.env.EMAIL_USER)
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "OK" : "MISSING")

console.log('VAPID loaded:', !!process.env.VAPID_PUBLIC_KEY)