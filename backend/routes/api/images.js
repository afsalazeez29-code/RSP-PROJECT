const express = require('express');
const upload = require('../../middleware/multer');
const authMiddleware = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const imageController = require('../../controllers/imageController');

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('file'), asyncHandler(imageController.uploadImage));
router.post('/user/upload-profile', authMiddleware, upload.single('profileImage'), (req, res, next) => {
  req.body.category = 'profile';
  return imageController.uploadImage(req, res, next);
});
router.get('/image/:id', asyncHandler(imageController.getImage));
router.get('/images', asyncHandler(imageController.listImages));
router.get('/user/:userId/images', asyncHandler(imageController.listUserImages));
router.delete('/image/:id/delete', authMiddleware, asyncHandler(imageController.deleteImage));

module.exports = router;
