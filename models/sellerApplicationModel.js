// models/sellerApplicationModel.js
const mongoose = require('mongoose');
const sellerApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      minlength: 3,
      maxlength: 100,
      index: true
    },

    storeDescription: {
      type: String,
      required: [true, 'Store description is required'],
      trim: true,
      maxlength: 1000
    },

    businessEmail: {
      type: String,
      required: [true, 'Business email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },

    phone: {
      type: String,
      required: [true, 'Business phone is required'],
      trim: true
    },

    address: {
      type: String,
      required: [true, 'Business address is required'],
      trim: true,
      maxlength: 300
    },

    taxId: {
      type: String,
      trim: true,
      default: null
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true, // createdAt & updatedAt
    versionKey: false
  }
);

sellerApplicationSchema.index(
  { user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

// Fast admin filtering
sellerApplicationSchema.index({ status: 1, createdAt: -1 });

const SellerApplication = mongoose.model(
  'SellerApplication',
  sellerApplicationSchema
);

module.exports = SellerApplication