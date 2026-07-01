const express = require('express');
const auth = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const dashboardController = require('../../controllers/dashboardController');

const router = express.Router();

router.get('/', auth, asyncHandler(dashboardController.getDashboard));

module.exports = router;
