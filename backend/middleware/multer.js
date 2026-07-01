const path = require('path');
const multer = require('multer');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();

    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
      const error = new Error('Image must be PNG, JPG, JPEG, or WEBP.');
      error.status = 400;
      return callback(error);
    }

    return callback(null, true);
  }
});

module.exports = upload;
