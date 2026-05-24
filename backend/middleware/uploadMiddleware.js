import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    )
  }

})

const fileFilter = (req, file, cb) => {

  const allowed = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf'
  ]

  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only images and PDFs allowed'))
  }

}

const upload = multer({
  storage,
  fileFilter
})

export default upload