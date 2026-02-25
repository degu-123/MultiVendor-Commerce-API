const mongoose = require('mongoose');

// Sub-document: one product in cart
const cartItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
  ref: 'Product', 
  required: true },
  
  store: { type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true },
    
  price: { type: Number,
  required: true },   // snapshot price at time of add-to-cart
  quantity: { type: Number, 
  required: true },
  subtotal: { type: Number, 
  required: true }
});

// Main Cart schema
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId,
  ref: 'User', 
  required: true },
  
  items: [cartItemSchema],
  
  totalAmount: { type: Number, default: 0 },
  status: { type: String, 
  enum: ['active', 'ordered', 'cancelled'], 
  default: 'active' },
  
  shippingAddress: {
  fullName: String,
  addressLine: String,
  city: String,
  state: String,
  postalCode: String,
  country: String
}
},{ timestamps: true });

cartSchema.index(
  { user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

module.exports = mongoose.model('Cart', cartSchema);