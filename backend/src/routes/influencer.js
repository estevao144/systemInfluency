// backend/src/routes/influencer.js
const express = require('express');
const router = express.Router();
const {
  registerInfluencer,
  getMyProfile,
  generateCoupons,
  recordSale,
} = require('../controllers/influencerController');

router.post('/register', registerInfluencer);

router.get('/me', getMyProfile);

router.post('/generate-coupons', generateCoupons);

router.post('/sale', recordSale);

module.exports = router;
