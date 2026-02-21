import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'

dotenv.config()

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' })
})

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`)
})
