import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/user.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json())

app.use('/api/users', userRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' })
})

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`)
})
