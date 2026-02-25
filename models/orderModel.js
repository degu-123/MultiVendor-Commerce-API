const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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

const orderSchema = new mongoose.Schema({

  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: [
      "PENDING",
      "CONFIRMED",
      "PARTIALLY_SHIPPED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED"
    ],
    default: "PENDING",
    index: true
  },

  paymentMethod: {
    type: String,
    enum: ["COD", "ONLINE"],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["UNPAID", "PAID", "REFUNDED"],
    default: "UNPAID",
    index: true
  },

  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true }
  },

  items: {
    type: [orderItemSchema],
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

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;