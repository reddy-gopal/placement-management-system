import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes/index.js'
import { connectDB } from './config/config.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', router)

app.use((err, req, res, next) => {
    if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}` })
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message })

    res.status(err.statusCode || err.status || 500).json({ message: err.message })
})

const port = process.env.PORT || 5000

const startServer = async () => {
    await connectDB()

    app.listen(port, () => {
        console.log(`SERVER running on port ${port}`)
    })
}

startServer()
