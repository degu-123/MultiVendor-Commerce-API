const Review = require("../models/reviewModel");
const SubOrder = require("../models/subOrderModel");
const AppError=require('../utils/AppError');
const mongoose = require("mongoose");
const Product=require('../models/productModel');

//update product rating 
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: stats[0].avgRating,
      numReviews: stats[0].numReviews
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      numReviews: 0
    });
  }
};

const createReviewService = async ({ userId, subOrderId, productId, rating, comment }) => {

  // 1️⃣ Find sub-order and ensure product is delivered
  const subOrder = await SubOrder.findOne({
    _id: subOrderId,
    vendorStatus: "DELIVERED",
    "items.product": productId
  });

  if (!subOrder) {
    throw new AppError("You can review only purchased and delivered products from this vendor.",400);
  }

  // 2️⃣ Prevent duplicate review for same product/vendor/subOrder
  const existingReview = await Review.findOne({
    user: userId,
    product: productId,
    subOrder: subOrder._id
  });

  if (existingReview) {
    throw new AppError("You already reviewed this product for this vendor/sub-order.",400);
  }
  // Validate rating
  if (rating && (rating < 1 ||rating > 5)) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // 3️⃣ Create the review
  const review = await Review.create({
    user: userId,
    product: productId,
    rating,
    comment,
    order: subOrder.parentOrder,
    subOrder: subOrder._id,
    isVerifiedPurchase: true
  });

  // 4️⃣ Update aggregate rating for the product
  await updateProductRating(productId);

  return review;
};

const updateReviewService = async (userId, reviewId, data) => {
  // Find review by userId and reviewId
  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) throw new AppError('Review not found or not yours to edit', 404);

  // Validate rating
  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Update only provided fields
  if (data.rating) review.rating = data.rating;
  if (data.comment) review.comment = data.comment;

  await review.save();

  // Recalculate product rating after update
  await updateProductRating(review.product);

  return review;
};

const deleteReviewService = async (userId, role, reviewId) => {
  let query;

  // 🔹 Build query based on role
  if (role === 'customer') {
    query = { _id: reviewId, user: userId };
  } else if (role === 'admin' || role === 'superAdmin') {
    query = { _id: reviewId };
  } else {
    throw new AppError('Unauthorized action', 403);
  }
// Find review and get productId first
  const review = await Review.findOne(query);
  if (!review) {
    const msg =
      role === 'customer'
        ? 'Review not found or not yours to delete'
        : 'Review not found';
    throw new AppError(msg, 404);
  }
  const productId = review.product;
//Delete review 
  await Review.deleteOne({ _id: review._id });

 //Recalculate product rating after deletion
  await updateProductRating(productId);

  return { message: 'Review deleted successfully',
     reviewId
  };
};

const getProductReviewsPublicService = async (productId, options = {}) => {
  const page = Math.max(parseInt(options.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(options.limit) || 5, 1), 20);
  const skip = (page - 1) * limit;

  // fetch reviews for this product
  const [reviews, totalReviews] = await Promise.all([
    Review.find({ product: productId })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate('user', 'name') 
      .lean(),
    Review.countDocuments({ product: productId })
  ]);

  const totalPages = Math.ceil(totalReviews / limit);

  return {
    pagination: {
      page,
      totalReviews,
      totalPages,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    reviews
  };
};

// Admin version — full user info
const getProductReviewsAdminService = async (productId, options = {}) => {
  const page = Math.max(parseInt(options.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(options.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const [reviews, totalReviews] = await Promise.all([
    Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role')
      .populate('order', 'orderNumber')
      .populate('subOrder', 'vendorStatus')
      .lean(),
    Review.countDocuments({ product: productId })
  ]);

  const totalPages = Math.ceil(totalReviews / limit);

  return {
    pagination: {
      page,
      totalReviews,
      totalPages,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    reviews
  };
};

module.exports = {
  createReviewService,updateReviewService,
  deleteReviewService,
  getProductReviewsAdminService,
  getProductReviewsPublicService
};