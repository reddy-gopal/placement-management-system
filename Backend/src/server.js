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
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err)
        return res.status(400).json({ success: false, message: 'Request body contains invalid JSON' })
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: `Invalid ${err.path}` })
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: err.message })
    if (err.code === 11000)
        return res.status(409).json({ success: false, message: 'A record with these unique details already exists' })

    const status = err.statusCode || err.status || 500
    const message = status >= 500 ? 'Internal server error' : err.message
    return res.status(status).json({ success: false, message })
})

const port = process.env.PORT || 4000

const startServer = async () => {
    await connectDB()

    app.listen(port, () => {
        console.log(`SERVER running on port ${port}`)
    })
}

startServer()
