import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs/promises'
import path from 'path'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export class UploadService {
  private isCloudinaryConfigured() {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    )
  }

  private getPublicBaseUrl() {
    return process.env.UPLOAD_PUBLIC_BASE_URL || 'http://localhost:3110'
  }

  async uploadSingle(
    file: Express.Multer.File,
    width: number = 1200,
    height: number = 800,
    quality: number = 80
  ) {
    try {
      const optimizedBuffer = await sharp(file.path)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer()

      if (this.isCloudinaryConfigured()) {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'delices-afro-caraibe',
              transformation: [
                { width, height, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
          uploadStream.end(optimizedBuffer)
        })

        await fs.unlink(file.path)

        return {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
        }
      }

      const parsed = path.parse(file.path)
      const localFilename = `${parsed.name}.jpg`
      const localPath = path.join(parsed.dir, localFilename)
      await fs.writeFile(localPath, optimizedBuffer)
      if (localPath !== file.path) {
        await fs.unlink(file.path).catch(() => undefined)
      }

      return {
        url: `${this.getPublicBaseUrl()}/uploads/${encodeURIComponent(localFilename)}`,
        publicId: localFilename,
        width,
        height,
        format: 'jpg',
        size: optimizedBuffer.length,
      }
    } catch (error) {
      console.error('Upload single error:', error)
      throw error
    }
  }

  async uploadMultiple(files: Express.Multer.File[]) {
    try {
      const uploadPromises = files.map(file => this.uploadSingle(file))
      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Upload multiple error:', error)
      throw error
    }
  }

  async deleteImage(publicId: string) {
    try {
      const decodedPublicId = decodeURIComponent(publicId)
      if (this.isCloudinaryConfigured()) {
        await cloudinary.uploader.destroy(decodedPublicId)
        return
      }
      const localPath = path.join('uploads', decodedPublicId)
      await fs.unlink(localPath)
    } catch (error) {
      console.error('Delete image error:', error)
      throw error
    }
  }

  async getImageInfo(publicId: string) {
    try {
      const decodedPublicId = decodeURIComponent(publicId)
      if (this.isCloudinaryConfigured()) {
        const result = await cloudinary.api.resource(decodedPublicId)
        return {
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
          createdAt: result.created_at,
        }
      }

      const localPath = path.join('uploads', decodedPublicId)
      const stats = await fs.stat(localPath)
      return {
        publicId: decodedPublicId,
        url: `${this.getPublicBaseUrl()}/uploads/${encodeURIComponent(decodedPublicId)}`,
        format: path.extname(decodedPublicId).replace('.', '') || 'jpg',
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
      }
    } catch (error) {
      console.error('Get image info error:', error)
      throw error
    }
  }
}
