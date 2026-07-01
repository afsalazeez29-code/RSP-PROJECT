const express = require('express');
const auth = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const searchController = require('../../controllers/searchController');

const router = express.Router();

router.get('/search', auth, asyncHandler(searchController.search));

module.exports = router;