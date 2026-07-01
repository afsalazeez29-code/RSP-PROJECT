const express = require('express');
const auth = require('../../middleware/auth');
const upload = require('../../middleware/multer');
const asyncHandler = require('../../utils/asyncHandler');
const userController = require('../../controllers/userController');

const router = express.Router();

router.get('/profile', auth, asyncHandler(userController.getProfile));
router.get('/profile/:username', auth, asyncHandler(userController.getPublicProfile));
router.put('/profile/image', auth, upload.single('image'), asyncHandler(userController.updateProfileImage));
router.delete('/profile', auth, asyncHandler(userController.deleteProfile));

module.exports = router;
