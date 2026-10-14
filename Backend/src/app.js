import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes/index.js'
import { connectDB } from './config/config.js'

const app = express()

const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean)

app.disable('x-powered-by')
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Make sure MongoDB is connected before any route runs (no-op once connected).
app.use(async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch {
        res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' })
    }
})

app.use('/api/v1', router)

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' })
})

app.use((err, req, res, next) => {
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: `Invalid ${err.path}` })
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: err.message })

    const response = { success: false, message: err.message }
    if (err.needsVerification) {
        response.needsVerification = true
        if (err.email) response.email = err.email
    }

    res.status(err.statusCode || err.status || 500).json(response)
})

export default app
