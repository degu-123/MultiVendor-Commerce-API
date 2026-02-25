const Order = require('../models/orderModel');
const SubOrder = require('../models/subOrderModel');
const AppError = require('../utils/AppError');
const Store=require('../models/storeModel');

const getCustomerOrders = async (userId, options={}) => {
  
  const page = Math.max(parseInt(options.page) || 1, 1);
 const limit = Math.min(Math.max(parseInt(options.limit) || 5, 1), 50);
 
  const skip = (page - 1) * limit;

  const query = { user: userId };
  if (options.status) query.status = options.status;

const [orders,totalOrders] = await Promise.all([
 Order.find(query)
     .sort({ createdAt: -1 })
     .skip(skip)
     .limit(limit)
     .lean(),
  Order.countDocuments(query)
  ])
  const totalPages = Math.ceil(totalOrders / limit);

  return {
    pagination:{
      page,
      totalOrders,
      totalPages,
      limit,
      hasNextPage:page<totalPages,
      hasPrevPage:page>1
    },
    orders
  };
};

const getCustomerOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError('Order not found', 404);

  return order;
};


const getSellerSubOrders = async (sellerId, options = {}) => {
  
  const page = Math.max(parseInt(options.page) || 1, 1);
 const limit = Math.min(Math.max(parseInt(options.limit) || 5, 1), 50);
  const skip = (page - 1) * limit;
 
// Find stores owned by this seller
  const sellerStores = await Store.find({ ownerId: sellerId }).select('_id').lean();
  const storeIds = sellerStores.map(s => s._id);

  if (!storeIds.length) {
    return {
      pagination: { page, totalSubOrders: 0, totalPages: 0, limit, hasNextPage: false, hasPrevPage: false },
      suborders: []
    };
  }

  const query = { store: { $in: storeIds } };
  
  if (options.status) query.storeStatus = options.status;

const [suborders,totalSubOrders]=await Promise.all([
    SubOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    SubOrder.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalSubOrders / limit);

  return {
    pagination:{
      page,
      totalSubOrders,
      totalPages,
      limit,
      hasNextPage:page<totalPages,
      hasPrevPage:page>1
    },
    suborders
  };
};

const getSellerSubOrderById = async (sellerId, subOrderId) => {
  // 1️⃣ Get all stores owned by seller
  const sellerStores = await Store.find({ ownerId: sellerId }).select('_id').lean();
  const storeIds = sellerStores.map(s => s._id);

  if (!storeIds.length) {
    throw new AppError('SubOrder not found', 404);
  }

  // 2️⃣ Find the suborder that belongs to one of seller's stores
  const suborder = await SubOrder.findOne({ 
    _id: subOrderId, 
    store: { $in: storeIds } 
  });

  if (!suborder) throw new AppError('SubOrder not found', 404);

  return{
    suborder
  };
};
//admin only order services

const getAllMainOrders = async (options = {}) => {
  const page = Math.max(parseInt(options.page) || 1, 1);
 const limit = Math.min(Math.max(parseInt(options.limit) || 5, 1), 50);
  const skip = (page - 1) * limit;
          const query = {};

  if (options.status) query.status = options.status;
  if (options.paymentStatus) query.paymentStatus = options.paymentStatus;

  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) query.createdAt.$gte = new Date(options.startDate);
    if (options.endDate) query.createdAt.$lte = new Date(options.endDate);
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return { pagination:{
      page,
      total,
      totalPages,
      limit,
      hasNextPage:page<totalPages,
      hasPrevPage:page>1
    },
    orders
     };
};
//for admin only
const getMainOrderById = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  const suborders = await SubOrder.find({ parentOrder: orderId });

  return { order, suborders };
};

//admin only update order status
const updateMainOrderStatus = async (orderId, status) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  order.status = status;
  await order.save();

  return order;
};

//admin only issue
const updatePaymentStatusService = async (orderId, paymentStatus) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  order.paymentStatus = paymentStatus;
  await order.save();

  return order;
};

module.exports = {
  //customer modules
  getCustomerOrders, getCustomerOrderById
  //seller modules
  ,getSellerSubOrders, getSellerSubOrderById
  //admin modules
  ,getAllMainOrders,
  getMainOrderById,
  updateMainOrderStatus,
  updatePaymentStatusService 
};