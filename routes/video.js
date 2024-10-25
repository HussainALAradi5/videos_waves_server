const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const videoController = require('../controllers/videos')
const authService = require('../service/auth')
const commentController = require('../controllers/comments')

// Set up Multer storage and file naming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/videos'))
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

router.get('/', videoController.getAllVideos)
router.get('/:id', videoController.getVideoById)
router.get('/:id/comments', commentController.getCommentsByVideo)
router.use(authService.authenticate)
router.post('/upload', upload.single('file'), videoController.uploadVideo)
router.get('/random', videoController.showRandomVideo)
router.put('/:id', videoController.updateVideo)
router.delete('/:id', videoController.removeVideo)
router.post('/:id/like', videoController.likeVideo)
router.post('/:id/unlike', videoController.unlikeVideo)
router.post('/:id/comments', commentController.addComment)
router.put('/:id/comments/:commentId', commentController.editComment)
router.delete('/:id/comments/:commentId', commentController.removeComment)

module.exports = router
