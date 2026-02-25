
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    
 order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  subOrder: { type: mongoose.Schema.Types.ObjectId, ref: "SubOrder", required: true },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer value",
      },
    },

    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      minlength: [3, "Comment must be at least 3 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews (one review per user per product)

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Optimize product review listing (with sorting newest first)
reviewSchema.index({ product: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;