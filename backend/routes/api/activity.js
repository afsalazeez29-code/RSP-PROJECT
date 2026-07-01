const express = require('express');
const auth = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const activityController = require('../../controllers/activityController');

const router = express.Router();

router.get('/', auth, asyncHandler(activityController.getActivity));

module.exports = router;
