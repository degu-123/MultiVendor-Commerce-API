const express = require('express');
const router = express.Router();

const protectRoute = require('../middlewares/authMiddleware');
const restrictTo = require('../middlewares/roleMiddleware');

const {
  createReview,
  updateReview,
  deleteReview,
  getProductReviewsPublic,
  getProductReviewsAdmin
} = require('../controllers/reviewController');

// 🔹 Public routes
router.get('/public/product/:id', getProductReviewsPublic);

// 🔹 Protected routes for customers
router.use(protectRoute);

// Customer actions: create, update, delete their own review
router.post('/', restrictTo('customer'), createReview);
router.patch('/:id', restrictTo('customer'), updateReview);
router.delete('/:id', restrictTo('customer','admin','superAdmin'), deleteReview);

// Admin routes: full management
router.get('/admin/product/:id', restrictTo('admin','superAdmin'), getProductReviewsAdmin);

module.exports = router;