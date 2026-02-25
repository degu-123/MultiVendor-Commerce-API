const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },

  catalogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Catalog',
    required: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  costPrice: {
    type: Number,
    required: true,
    min: 0
  },

  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },

  stock: {
    type: Number,
    required: true,
    min: 0
  },
  
  images: [
  {
    url: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }
],
rating: {
  type: Number,
  default: 0,
},
numReviews: {
  type: Number,
  default: 0,
},

  isActive: {
    type: Boolean,
    default: true // seller control
  },

  isBanned: {
    type: Boolean,
    default: false // admin control
  },
bannedAt: Date,
banReason: String,
  tags: {
    type: [String],
    default: []
  },

  aiMeta: {
    embedding: {
      type: [Number], // for vector embedding
      default: []
    },
    lastAnalyzedAt: Date
  },

  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt:Date

}, { timestamps: true });


// 🔎 Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ storeId: 1, isActive: 1 });
productSchema.index({
  isActive: 1,
  isBanned: 1,
  isDeleted: 1
});//public list to product
productSchema.index({ sellingPrice: 1 });
productSchema.index({ tags: 1 });

module.exports = mongoose.model('Product', productSchema);