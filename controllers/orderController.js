const { getCustomerOrders, getCustomerOrderById,
  getSellerSubOrders,getSellerSubOrderById,
  getAllMainOrders,
  getMainOrderById,
  updateMainOrderStatus,
  updatePaymentStatusService 
}= require('../services/orderService');

const getOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page, limit, status } = req.query;
    const result = await getCustomerOrders(userId, { page, limit, status });

    res.status(200).json({
      status: 'SUCCESS',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.id;

    const result = await getCustomerOrderById(userId, orderId);

    res.status(200).json({
      status: 'SUCCESS',
      order:result
    });
  } catch (err) {
    next(err);
  }
};

const getSubOrders = async (req, res, next) => {
  try {
    const sellerId = req.user._id; 
    const { page, limit, status } = req.query;

  const result = await getSellerSubOrders(sellerId, { page, limit, status });

    res.json({
      status: 'SUCCESS',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

const getSubOrderById = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const subOrderId = req.params.id;

  const result = await getSellerSubOrderById(sellerId, subOrderId);

    res.json({
      status: 'SUCCESS',
      order:result
    });
  } catch (err) {
    next(err);
  }
};
//admin only controller functions
const getAllOrders = async (req, res, next) => {
  try {
    const { page, limit, status, paymentStatus, startDate, endDate } = req.query;

 const result = await getAllMainOrders({
      page,
      limit,
      status,
      paymentStatus,
      startDate,
      endDate
    });

    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

const getOrdersById = async (req, res, next) => {
  try {
    const orderId= req.params.id;
    const result = await getMainOrderById(orderId);

    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId  = req.params.id;
    const { status } = req.body;

    if (!status) throw new AppError('Status is required', 400);

    const updatedOrder = await updateMainOrderStatus(orderId, status);

    res.status(200).json({
      status: 'success',
      message: 'Order status updated',
      orderStatus:updatedOrder
    });
  } catch (err) {
    next(err);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { paymentStatus } = req.body;

    if (!paymentStatus) throw new AppError('Payment status is required', 400);

    const updatedOrder = await updatePaymentStatusService(orderId, paymentStatus);

    res.status(200).json({
      status: 'success',
      message: 'Payment status updated',
      paymentStatus:updatedOrder
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { 
  //customer
  getOrders, 
  getOrderById,
//for seller 
getSubOrders, 
getSubOrderById,
//for admin
getAllOrders,
  getOrdersById,
  updateOrderStatus,
  updatePaymentStatus };