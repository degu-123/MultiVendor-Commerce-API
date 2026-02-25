
const AppError = require("../utils/AppError");
const { createReviewService,updateReviewService,
  deleteReviewService,
  getProductReviewsAdminService,
  getProductReviewsPublicService 
} = require("../services/reviewService");

const createReview = async (req, res, next) => {
  try {
    const userId = req.user._id; 
    const { subOrderId, productId, rating, comment } = req.body;

    if (!subOrderId || !productId || !rating) {
      throw new AppError("subOrderId, productId, and rating are required", 400);
    }

    const review = await createReviewService({ userId, subOrderId, productId, rating, comment });

    res.status(201).json({
      status: "success",
      message: "Review created successfully",
      review
    });
  } catch (err) {
    next(err); 
  }
};

const updateReview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    const updatedReview = await updateReviewService(userId, reviewId, { rating, comment });

    res.status(200).json({
      status: 'success',
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (err) {
    next(err); 
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const reviewId = req.params.id;

    const result = await deleteReviewService(userId, role, reviewId);

    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

const getProductReviewsPublic = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { page, limit } = req.query;

    const result = await getProductReviewsPublicService(productId, { page, limit });

    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// Admin endpoint
const getProductReviewsAdmin = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { page, limit } = req.query;

    const result = await getProductReviewsAdminService(productId, { page, limit });

    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getProductReviewsAdmin,
  getProductReviewsPublic
};