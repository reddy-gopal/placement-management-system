import app from './app.js'
import { connectDB } from './config/config.js'

const port = process.env.PORT || 4000

const startServer = async () => {
    try {
        await connectDB()
    } catch {
        process.exit(1)
    }

    app.listen(port, () => {
        console.log(`SERVER running on port ${port}`)
    })
}

startServer()
