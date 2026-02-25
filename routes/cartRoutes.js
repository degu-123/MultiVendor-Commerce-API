const express = require('express');
const router = express.Router();
const protectRoute= require('../middlewares/authMiddleware');

const {
  addToCart,removeFromCart,updateCartQuantity,
  getCart,checkoutCart
}=require('../controllers/cartController');
//run for all routes
router.use(protectRoute);

router.get('/',getCart);

router.post('/',addToCart);

router.delete('/:id',
removeFromCart);

router.patch('/:id',updateCartQuantity);

router.post('/checkout',
checkoutCart);
module.exports=router;
