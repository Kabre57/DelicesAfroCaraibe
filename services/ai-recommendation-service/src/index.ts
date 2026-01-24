import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import aiRoutes from './routes/ai-recommendation.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3013

app.use(cors())
app.use(express.json())

app.use('/api', aiRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-recommendation-service' })
})

app.listen(PORT, () => {
  console.log(`AI recommendation service running on port ${PORT}`)
})
