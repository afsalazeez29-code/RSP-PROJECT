const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');
const ImageAsset = require('../models/ImageAsset');
const Recipe = require('../models/recipesDetails');
const User = require('../models/Users');
const logger = require('../utils/logger');

const allowedCategories = new Set(['recipe', 'profile', 'post', 'general']);
const DEFAULT_PROFILE_IMAGE = 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717933/defaultpfp_kw2j6n.png';
const folderByCategory = {
  recipe: 'recipe-app/recipes',
  profile: 'recipe-app/profiles',
  post: 'recipe-app/recipes',
  general: 'recipe-app/defaults'
};

const normalizeCategory = (value) => (
  allowedCategories.has(value) ? value : 'general'
);

const buildFolder = (category) => folderByCategory[category] || folderByCategory.general;

const buildTransformation = (category) => {
  if (category === 'profile') {
    return [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }
    ];
  }

  if (category === 'recipe') {
    return [
      { width: 800, height: 600, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
    ];
  }

  return [
    { quality: 'auto', fetch_format: 'auto' }
  ];
};

const deleteOldPublicId = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.deleteImage(publicId);
  } catch (error) {
    logger.warn(`Cloudinary old image cleanup failed: ${error.message}`);
  }
};

const uploadBufferToCloudinary = (file, category) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream({
    folder: buildFolder(category),
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    transformation: buildTransformation(category)
  }, (error, result) => {
    if (error) return reject(error);
    return resolve(result);
  });

  Readable.from([file.buffer]).pipe(uploadStream);
});

const serializeImage = (image) => ({
  id: image._id.toString(),
  imageUrl: image.imageUrl,
  imageName: image.imageName,
  publicId: image.publicId,
  category: image.category,
  width: image.width,
  height: image.height,
  imageSize: image.imageSize,
  format: image.format,
  uploadedAt: image.createdAt,
  recipeId: image.recipe ? image.recipe.toString() : null,
  thumbnailUrl: image.imageUrl.replace('/image/upload/', '/image/upload/w_200,h_200,c_fill,f_auto,q_auto/')
});

const ensureCloudinaryConfigured = () => {
  if (!cloudinary.isConfigured()) {
    const error = new Error(`Cloudinary is missing configuration: ${cloudinary.getMissingConfig().join(', ')}`);
    error.status = 500;
    error.code = 'CLOUDINARY_CONFIG_MISSING';
    throw error;
  }
};

const uploadImage = async (req, res, next) => {
  let cloudinaryResult = null;

  try {
    ensureCloudinaryConfigured();

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    const category = normalizeCategory(req.body.category);
    let recipe = null;
    let user = null;

    if (req.body.recipeId) {
      recipe = await Recipe.findOne({
        _id: req.body.recipeId,
        createdBy: req.user.userId
      });

      if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found for this user.' });
      }
    }

    if (category === 'profile') {
      user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
    }

    cloudinaryResult = await uploadBufferToCloudinary(req.file, category);

    const image = await ImageAsset.create({
      owner: req.user.userId,
      category,
      imageUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      imageName: cloudinaryResult.original_filename || req.file.originalname,
      format: cloudinaryResult.format,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      imageSize: cloudinaryResult.bytes,
      resourceType: cloudinaryResult.resource_type,
      recipe: recipe?._id || null
    });

    if (category === 'profile') {
      await deleteOldPublicId(user.profileImagePublicId);
      user.profileImage = image.imageUrl;
      user.profileImagePublicId = image.publicId;
      await user.save();
    }

    if (recipe) {
      await deleteOldPublicId(recipe.imagePublicId);
      recipe.image = image.imageUrl;
      recipe.imageUrl = image.imageUrl;
      recipe.imagePublicId = image.publicId;
      await recipe.save();
    }

    logger.info('Cloudinary image uploaded', {
      imageId: image._id.toString(),
      category,
      owner: req.user.userId,
      publicId: image.publicId
    });

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: image.imageUrl,
      imagePublicId: image.publicId,
      imageName: image.imageName,
      image: serializeImage(image)
    });
  } catch (error) {
    if (cloudinaryResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id);
      } catch (cleanupError) {
        logger.warn(`Cloudinary cleanup failed: ${cleanupError.message}`);
      }
    }

    return next(error);
  }
};

const getImage = async (req, res) => {
  const image = await ImageAsset.findOne({
    _id: req.params.id,
    deletedAt: null
  });

  if (!image) {
    return res.status(404).json({ message: 'Image not found.' });
  }

  return res.json(serializeImage(image));
};

const listImages = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const query = { deletedAt: null };

  if (req.query.category) {
    query.category = normalizeCategory(req.query.category);
  }

  const [images, total] = await Promise.all([
    ImageAsset.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ImageAsset.countDocuments(query)
  ]);

  return res.json({
    images: images.map(serializeImage),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    page,
    limit
  });
};

const listUserImages = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const query = {
    owner: req.params.userId,
    deletedAt: null
  };

  if (req.query.category) {
    query.category = normalizeCategory(req.query.category);
  }

  const [images, total] = await Promise.all([
    ImageAsset.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ImageAsset.countDocuments(query)
  ]);

  return res.json({
    images: images.map(serializeImage),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    page,
    limit
  });
};

const deleteImage = async (req, res, next) => {
  try {
    ensureCloudinaryConfigured();

    const image = await ImageAsset.findOne({
      _id: req.params.id,
      deletedAt: null
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found.' });
    }

    if (image.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own images.' });
    }

    await cloudinary.deleteImage(image.publicId);

    image.deletedAt = new Date();
    await image.save();

    await User.updateOne(
      { _id: req.user.userId, profileImage: image.imageUrl },
      { $set: { profileImage: DEFAULT_PROFILE_IMAGE, profileImagePublicId: null } }
    );

    await Recipe.updateMany(
      { createdBy: req.user.userId, image: image.imageUrl },
      { $set: { image: '', imageUrl: null, imagePublicId: null } }
    );

    logger.info('Cloudinary image deleted', {
      imageId: image._id.toString(),
      owner: req.user.userId,
      publicId: image.publicId
    });

    return res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadImage,
  getImage,
  listImages,
  listUserImages,
  deleteImage
};
