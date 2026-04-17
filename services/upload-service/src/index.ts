import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import uploadRoutes from './routes/upload.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3010
const uploadsDir = path.resolve('uploads')

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))
app.get('/uploads/:file', (req, res) => {
  const label = String(req.params.file || 'image-indisponible')
    .replace(path.extname(String(req.params.file || '')), '')
    .slice(0, 32)

  res.type('image/svg+xml')
  res.send(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#f8fafc" />
      <rect x="80" y="80" width="1040" height="640" rx="36" fill="#e2e8f0" />
      <text x="600" y="360" text-anchor="middle" font-size="44" font-family="Arial, sans-serif" fill="#334155">
        Image indisponible
      </text>
      <text x="600" y="430" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" fill="#64748b">
        ${label}
      </text>
    </svg>`
  )
})

app.use('/api', uploadRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'upload-service' })
})

app.listen(PORT, () => {
  console.log(`Upload service running on port ${PORT}`)
})
