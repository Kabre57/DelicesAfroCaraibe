import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { UploadController } from '../controllers/upload.controller'

const router = Router()
const controller = new UploadController()

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
})

router.post('/upload/single', upload.single('image'), controller.uploadSingle.bind(controller))
router.post('/upload/multiple', upload.array('images', 10), controller.uploadMultiple.bind(controller))
router.delete('/upload/:publicId', controller.deleteImage.bind(controller))
router.get('/upload/:publicId/info', controller.getImageInfo.bind(controller))

export default router
