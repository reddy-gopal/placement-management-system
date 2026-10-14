import mongoose from 'mongoose'

// One shared connection per process. Serverless platforms (Vercel) reuse a warm
// instance across requests, so later calls must not open a new connection.
let connection = null

export const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection

    if (!connection) {
        connection = mongoose
            .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
            .then((conn) => {
                console.log('DB CONNECTED SUCCESSFULLY')
                return conn
            })
            .catch((error) => {
                connection = null
                console.error(`DB CONNECTION FAILED : ${error.message} `)
                throw error
            })
    }

    return connection
}
