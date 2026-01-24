import { Request, Response } from 'express'
import { UploadService } from '../services/upload.service'

const uploadService = new UploadService()

export class UploadController {
  async uploadSingle(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' })
      }

      const { width, height, quality } = req.query
      
      const result = await uploadService.uploadSingle(
        req.file,
        Number(width) || 1200,
        Number(height) || 800,
        Number(quality) || 80
      )

      res.json(result)
    } catch (error: any) {
      console.error('Upload single error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async uploadMultiple(req: Request, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' })
      }

      const results = await uploadService.uploadMultiple(req.files)

      res.json({ images: results })
    } catch (error: any) {
      console.error('Upload multiple error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async deleteImage(req: Request, res: Response) {
    try {
      const { publicId } = req.params

      if (!publicId) {
        return res.status(400).json({ error: 'Public ID is required' })
      }

      await uploadService.deleteImage(publicId)

      res.json({ message: 'Image deleted successfully' })
    } catch (error: any) {
      console.error('Delete image error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getImageInfo(req: Request, res: Response) {
    try {
      const { publicId } = req.params

      if (!publicId) {
        return res.status(400).json({ error: 'Public ID is required' })
      }

      const info = await uploadService.getImageInfo(publicId)

      res.json(info)
    } catch (error: any) {
      console.error('Get image info error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}
