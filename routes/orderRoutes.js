const express = require('express');
const router = express.Router();
//order controllers
const { 
  getOrders,
getOrderById,

getSubOrders, 
getSubOrderById,

  getAllOrders,
  getOrdersById,
  updateOrderStatus,
  updatePaymentStatus
} = require('../controllers/orderController');
  
const protectRoute= require('../middlewares/authMiddleware');
const restrictTo=require('../middlewares/roleMiddleware');

router.use(protectRoute);
//public routes
router.get('/my', getOrders);
router.get('/my/:id', getOrderById);

//seller routes
router.get('/seller',
restrictTo('seller'),
getSubOrders);

router.get('/seller/:id',
restrictTo('seller'),
getSubOrderById);

//admin only routes
router.get('/admin',
restrictTo('admin','superAdmin'),
getAllOrders);

router.get('/admin/:id',
restrictTo('admin','superAdmin'),
getOrdersById);

router.patch('/admin/:id/status',restrictTo('admin','superAdmin'),updateOrderStatus);

router.patch('/admin/:id/payment',restrictTo('admin','superAdmin'),updatePaymentStatus);

module.exports = router;