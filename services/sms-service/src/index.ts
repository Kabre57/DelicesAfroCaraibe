import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import smsRoutes from './routes/sms.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3012

app.use(cors())
app.use(express.json())

app.use('/api', smsRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sms-service' })
})

app.listen(PORT, () => {
  console.log(`SMS service running on port ${PORT}`)
})
