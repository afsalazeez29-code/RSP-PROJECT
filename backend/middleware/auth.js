const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const jwtAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('_id email name username profileImage bio isBlocked likedRecipes createdAt');

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    req.user = {
      _id: user._id,
      userId: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      username: user.username,
      profileImage: user.profileImage,
      bio: user.bio,
      likedRecipes: user.likedRecipes || [],
      createdAt: user.createdAt
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('_id email name username profileImage bio isBlocked likedRecipes createdAt');

    if (user && !user.isBlocked) {
      req.user = {
        _id: user._id,
        userId: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
        bio: user.bio,
        likedRecipes: user.likedRecipes || [],
        createdAt: user.createdAt
      };
    }
  } catch (error) {
    // Optional auth — invalid tokens are ignored
  }

  return next();
};

module.exports = jwtAuth;
module.exports.jwtAuth = jwtAuth;
module.exports.optionalAuth = optionalAuth;