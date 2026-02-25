const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Order=require('../models/orderModel');
const SubOrder = require('../models/subOrderModel');
const AppError=require('../utils/AppError');

async function addItemToCart(userId, productId, quantity = 1){
  
  const qty = quantity > 0 ? quantity : 1;
  
//find product check status
  const product = await Product.findById(productId);
  if (!product || !product.isActive||product.isDeleted||product.isBanned) {
    throw new AppError('Product not available');
  }
  if (qty > product.stock) {
    throw new Error('Insufficient stock');
  }
  //  Get or create active cart
  let cart = await Cart.findOne({ user: userId, status: 'active' });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }
  //Check if product already exists in cart
  const item = cart.items.find(i =>
    i.product.toString() === productId.toString()
  );
  if (item) {
    const newQty = item.quantity + qty;

    if (newQty > product.stock) {
      throw new AppError('Insufficient stock');
    }
    item.quantity = newQty;
    item.subtotal = item.price * newQty;

  } else {
    cart.items.push({
      product: product._id,
      store: product.storeId,
      price: product.sellingPrice,
      quantity: qty,
      subtotal: product.sellingPrice * qty
    });
  }
  // Recalculate cart total
  cart.totalAmount = cart.items.reduce(
    (sum, i) => sum + i.subtotal,
    0
  );
  await cart.save();
  
  await cart.populate('items.product');
// get the updated item
const updatedItem = cart.items.find(i =>
  i.product._id.toString() === productId.toString()
);
return {
  message: 'Product added to cart successfully',
  productName: updatedItem.product.name,
  quantity: updatedItem.quantity,
  totalPrice: updatedItem.subtotal
};
};

async function removeItemFromCart(userId, productId){

  const cart = await Cart.findOne({ user: userId, status: 'active' });

  if (!cart) {
    throw new AppError('Cart not found');
  }
  //  Find item index
  const itemIndex = cart.items.findIndex(item =>
    item.product.toString() === productId.toString()
  );

  if (itemIndex === -1) {
    throw new AppError('Product not found in cart');
  }
//  Remove item
  cart.items.splice(itemIndex, 1);

  // Recalculate total
  cart.totalAmount = cart.items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  await cart.save();
  return {
    message: 'Product removed from cart successfully'
  };
};

// Update product quantity in cart

async function updateCartItemQuantity(userId, productId, quantity){

  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than 0');
  }

  const cart = await Cart.findOne({ user: userId, status: 'active' });

  if (!cart) {
    throw new AppError('Cart not found');
  }

  const item = cart.items.find(item =>
    item.product.toString() === productId.toString()
  );

  if (!item) {
    throw new AppError('Product not found in cart');
  }

  const product = await Product.findById(productId);

  if (quantity > product.stock) {
    throw new AppError('Insufficient stock');
  }

  item.quantity = quantity;
  item.subtotal = item.price * quantity;

  cart.totalAmount = cart.items.reduce(
    (sum, i) => sum + i.subtotal,
    0
  );

  await cart.save();

  return {
    message: 'Cart updated successfully',
    productName: product.name,
    quantity: item.quantity,
    subtotal: item.subtotal
  };
};

async function getUserCart(userId){
  const cart = await Cart.findOne({
    user: userId,
    status: 'active'
  }).populate('items.product');

  if (!cart) {
    return {
      items: [],
      totalAmount: 0
    };
  }
  return {
    items: cart.items.map(item => ({
      productId: item.product._id,
      name: item.product.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal
    })),
    totalAmount: cart.totalAmount
  };
};

async function checkoutService(userId,shippingAddress, confirmPriceChange = false) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Get active cart WITH populated products
    const cart = await Cart.findOne({
      user: userId,
      status: 'active'
    })
      .populate({
        path: 'items.product',
        select: 'name images sellingPrice stock isActive isDeleted isBanned'
      })
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty');
    }

    let priceChanged = false;
    let totalAmount = 0;

    // 2️⃣ Validate products & detect price changes
    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive || product.isDeleted || product.isBanned) {
        throw new AppError(`Product unavailable`);
      }

      if (item.quantity > product.stock) {
        throw new AppError(`Insufficient stock for ${product.name}`);
      }

      if (item.price !== product.sellingPrice) {
        priceChanged = true;
        item.price = product.sellingPrice;
      }

      item.subtotal = item.price * item.quantity;
      totalAmount += item.subtotal;
    }

    cart.totalAmount = totalAmount;

    // 3️⃣ If price changed and not confirmed
    if (priceChanged && !confirmPriceChange) {
      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();

      return {
        status: 'PRICE_UPDATED',
        message: 'Some prices were updated. Please confirm.',
        cart
      };
    }

    // 4️⃣ Deduct stock atomically
    for (const item of cart.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session }
      );

      if (!updated) {
        throw new AppError(`Stock changed during checkout`);
      }
    }

    // 5️⃣ Group items by store
    const stores = {};

    for (const item of cart.items) {
      const storeId = item.store.toString();

      if (!stores[storeId]) {
        stores[storeId] = [];
      }

      stores[storeId].push(item);
    }

    // 6️⃣ Create Main Order Snapshot
    const mainOrderItems = cart.items.map(item => ({
      product: item.product._id,
      productName: item.product.name,
      productImage: item.product.images?.[0] || null,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));

    const orderNumber = `ORD-${Date.now()}`;

    const [mainOrder] = await Order.create(
      [{
        orderNumber,
        user: userId,
        status: 'PENDING',
        paymentMethod: 'COD',
        paymentStatus: 'UNPAID',
        shippingAddress: {
      fullName: shippingAddress.fullName,
      phone: shippingAddress.phone,
      address: shippingAddress.address,
      city: shippingAddress.city,
      country: shippingAddress.country
    },
        items: mainOrderItems,
        subtotalAmount: totalAmount,
        shippingAmount: 0,
        totalAmount: totalAmount
      }],
      { session }
    );

    // 7️⃣ Create SubOrders per Store
    for (const storeId in stores) {
      const storeItems = stores[storeId];

      const subtotal = storeItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );

      await SubOrder.create(
        [{
          parentOrder: mainOrder._id,
          store: storeId,
          vendorStatus: 'PENDING',
          items: storeItems.map(item => ({
            product: item.product._id,
            productName: item.product.name,
            productImage: item.product.images?.[0] || null,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal
          })),
          subtotalAmount: subtotal,
          shippingAmount: 0,
          totalAmount: subtotal
        }],
        { session }
      );
    }

    // 8️⃣ Mark cart as ordered
    cart.status = 'ordered';
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      status: 'SUCCESS',
      message: 'Order placed successfully',
      orderId: mainOrder._id
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

module.exports = {addItemToCart,removeItemFromCart,updateCartItemQuantity,getUserCart,checkoutService};