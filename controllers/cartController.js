
const AppError=require('../utils/AppError');
const {addItemToCart,removeItemFromCart,updateCartItemQuantity,getUserCart,
checkoutService} = require('../services/cartService');

async function addToCart(req, res,next){
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId) {
      return next(new AppError('Pls select product.',400))
    }

    const cart = await addItemToCart(userId, productId, quantity);

    return res.status(200).json({
      status:'success',
      ...cart
    });

  } catch (err) {
    next(err)
  }
};
//remove item from cart
async function removeFromCart(req, res,next){
  try {
    const userId = req.user._id;
    const productId = req.params.id;

    if (!productId) {
      return next(new AppError('Pls send product.',400))
    }

  const cart = await removeItemFromCart(userId, productId);

    return res.status(200).json({
      status:'success',
      ...cart
    });

  } catch (err) {
    next(err)
  }
};

async function updateCartQuantity(req, res,next){
  try {
    const userId = req.user._id;
    const productId = req.params.id;
    const quantity=Number(req.body.quantity);
    if (!productId) {
      return next(new AppError('Pls send product.',400))
    }
  if (!Number.isInteger(quantity) || quantity <= 0) {
  return next(new AppError('Quantity must be a positive integer', 400));
}
  const cart = await updateCartItemQuantity(userId, productId,quantity);

    return res.status(200).json({
      status:'success',
      ...cart
    });

  } catch (err) {
    next(err)
  }
};

async function getCart(req, res,next){
  try {
    const userId = req.user._id;
    
  const cart = await getUserCart(userId);
    return res.status(200).json({
      status:'success',
      ...cart
    });

  } catch (err) {
    next(err)
  }
};

async function checkoutCart(req, res,next){
  try {
    const userId = req.user._id;
    const { confirmPriceChange,shippingAddress } = req.body;

 const result = await checkoutService(
      userId,
      shippingAddress,
      confirmPriceChange
    );

    return res.status(200).json({
      ...result
    });

  } catch (err) {
    next(err)
  }
};

module.exports = {
  addToCart,removeFromCart,updateCartQuantity,
  getCart,checkoutCart
};