const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getMyProfile, upsertMyProfile } = require('../controllers/studentProfileController');

const router = express.Router();

router.use(requireAuth(['STUDENT']));

router.route('/profile').get(getMyProfile).post(upsertMyProfile);

module.exports = router;
