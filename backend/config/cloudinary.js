const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;

const requiredEnv = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingEnv = requiredEnv.filter((key) => {
  const value = process.env[key];
  return !value || value.includes('INSERT_');
});

if (missingEnv.length === 0) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

const managedUploadPrefixes = ['recipes/', 'profiles/', 'recipe-app/', 'rsp/'];

const normalizeFolder = (folder = 'recipes/') => {
  const value = String(folder || '').trim();
  if (value === 'profiles' || value === 'profiles/') return 'profiles/';
  if (value === 'recipes' || value === 'recipes/') return 'recipes/';
  return value.replace(/^\/+/, '').replace(/\/+$/, '') + '/';
};

const ensureConfigured = () => {
  if (missingEnv.length > 0) {
    throw new Error(`Cloudinary is missing configuration: ${missingEnv.join(', ')}`);
  }
};

const uploadImage = (fileBuffer, folder = 'recipes/') => new Promise((resolve, reject) => {
  ensureConfigured();

  const uploadStream = cloudinary.uploader.upload_stream({
    folder: normalizeFolder(folder),
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false
  }, (error, result) => {
    if (error) return reject(error);
    return resolve({
      secure_url: result.secure_url,
      public_id: result.public_id
    });
  });

  Readable.from([fileBuffer]).pipe(uploadStream);
});

const isManagedUploadPublicId = (publicId) => (
  Boolean(publicId) && managedUploadPrefixes.some((prefix) => publicId.startsWith(prefix))
);

const deleteImage = async (publicId) => {
  if (!publicId) return null;
  ensureConfigured();

  if (!isManagedUploadPublicId(publicId)) {
    return { result: 'skipped_static_asset' };
  }

  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

cloudinary.isConfigured = () => missingEnv.length === 0;
cloudinary.getMissingConfig = () => missingEnv;
cloudinary.uploadImage = uploadImage;
cloudinary.deleteImage = deleteImage;
cloudinary.deleteFromCloudinary = deleteImage;
cloudinary.isManagedUploadPublicId = isManagedUploadPublicId;

module.exports = cloudinary;