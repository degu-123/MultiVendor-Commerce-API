const mongoose = require('mongoose');

const subOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const subOrderSchema = new mongoose.Schema({

  parentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },

  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },

  vendorStatus: {
    type: String,
    enum: [
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED"
    ],
    default: "PENDING"
  },

  items: {
    type: [subOrderItemSchema],
    required: true
  },

  subtotalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  shippingAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  }

}, { timestamps: true });


// 🔥 Important Indexes
subOrderSchema.index({ parentOrder: 1 });
subOrderSchema.index({ store: 1 });
subOrderSchema.index({ vendorStatus: 1 });

const SubOrder = mongoose.model('SubOrder', subOrderSchema);

module.exports = SubOrder;