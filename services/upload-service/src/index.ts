import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import uploadRoutes from './routes/upload.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3010

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.resolve('uploads')))

app.use('/api', uploadRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'upload-service' })
})

app.listen(PORT, () => {
  console.log(`Upload service running on port ${PORT}`)
})
