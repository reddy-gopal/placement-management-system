import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes/index.js'
import { connectDB } from './config/config.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

const port = process.env.PORT || 4000

const startServer = async () => {
    await connectDB()

    app.listen(port, () => {
        console.log(`SERVER running on port ${port}`)
    })
}

startServer()
