const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const Recipe = require('../models/recipesDetails');
const authMiddleware = require('../middleware/auth');

// Create or initialize profile details for logged-in user
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // name and email are always taken from registration data
    const profileData = {
      name: user.name,
      email: user.email,
      bio: req.body.bio !== undefined ? req.body.bio : user.bio,
      profileImage: req.body.profileImage !== undefined ? req.body.profileImage : user.profileImage,
      profileImagePublicId: req.body.profileImagePublicId !== undefined ? req.body.profileImagePublicId : user.profileImagePublicId
    };

    user.bio = profileData.bio;
    user.profileImage = profileData.profileImage;
    user.profileImagePublicId = profileData.profileImagePublicId;

    await user.save();

    return res.status(201).json({ message: 'Profile created/updated', profile: profileData });
  } catch (error) {
    console.error('PROFILE CREATE ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Read profile for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const recipes = await Recipe.find({ createdBy: userId })
      .select('-__v')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage,
      profileImagePublicId: user.profileImagePublicId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      recipes
    });
  } catch (error) {
    console.error('PROFILE READ ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update profile for logged-in user
router.put('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Name and email remain from registration data (not overwritten here)
    const updates = {};
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.profileImage !== undefined) updates.profileImage = req.body.profileImage;
    if (req.body.profileImagePublicId !== undefined) updates.profileImagePublicId = req.body.profileImagePublicId;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    Object.assign(user, updates);
    await user.save();

    return res.status(200).json({ message: 'Profile updated', profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage,
      profileImagePublicId: user.profileImagePublicId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }});
  } catch (error) {
    console.error('PROFILE UPDATE ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete profile (user account) from logged-in user
// router.delete('/', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user && req.user.userId;
//     if (!userId) return res.status(401).json({ message: 'Unauthorized' });

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Optional: delete user's recipes too
//     await Recipe.deleteMany({ createdBy: userId });
//     await User.findByIdAndDelete(userId);

//     return res.status(200).json({ message: 'Profile and user account deleted' });
//   } catch (error) {
//     console.error('PROFILE DELETE ERROR:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// });

module.exports = router;
