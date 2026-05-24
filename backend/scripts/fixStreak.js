import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    await User.updateMany(
      {},
      {
        $set: {
          streak: {
            count: 0,
            lastActiveDate: null
          }
        }
      }
    )

    console.log("✅ Streak added to all users")

    process.exit()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()