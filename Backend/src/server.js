import express from 'express'
import 'dotenv/config';
import cors from 'cors'
import router from './routes/index.js'
import { connectDB  } from './config/config.js'
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded( {extended : true} ))

app.use( `/api`, router );

const port = process.env.PORT || 5000
const startServer = async () => {
    await connectDB();

    app.listen( port , () => {
        console.log(`SERVER running on port ${port}`)
    });
}
startServer()
