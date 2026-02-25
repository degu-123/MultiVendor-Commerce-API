const AppError=require('../utils/AppError');
const isStrongPassword=require('../utils/passwordCheck');
const {body,validationResult}=require('express-validator');
const handleValidation = (req, res, next) => {
const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(
      errors.array().map(err => err.msg),
      400
    ));
  }
  next();
};

const registerValidation=[
  body('name')
  .trim()
  .notEmpty()
  .withMessage('name is required')
  .isLength({min:3,max:30})
  .withMessage('name must b/n 3-30 charcters'),
  body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .normalizeEmail()
  .isEmail()
  .withMessage('Invalid email address'),
  body('password')
  .notEmpty()
  .withMessage('password is required')
  .isLength({min:8,max:100})
  .withMessage('password must contain at least 8 charcters')
  .custom(value=>{
    if(!isStrongPassword(value))throw new Error('password must contain lower,upper,number and special charcters');
    return true
  }),
  handleValidation
  ]
  const loginValidation=[
  body('email')
  .trim()
  .notEmpty()
  .normalizeEmail()
  .isEmail(),
  body('password')
  .notEmpty(),
 (req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
    return next(new AppError('You Entered Invalid email or password',400));
    }
    next()
  }
 ] 
 
const uploadProductValidation = [
 body('catalogId')
    .trim()
    .notEmpty()
    .withMessage('catalog Id is required'),
 
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Product name must be 3–20 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),

  body('costPrice')
    .notEmpty()
    .withMessage('Cost price is required')
    .isFloat({ gt: 0 })
    .withMessage('Cost price must be a positive number'),

  body('sellingPrice')
    .notEmpty().withMessage('Selling price is required')
    .isFloat({ gt: 0 })
    .withMessage('Selling price must be a positive number'),
    
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
    handleValidation
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('name must not be empty')
    .isLength({ min: 3, max: 50 })
    .withMessage('name cotain atleast 3 characters'),
   body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
 
 body('costPrice')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('costPrice must be greater than zero'),
    
 body('sellingPrice')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('sellingPrice must be greater than zero'),
    
 body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('stock must be 0 or posetive integer'),
    
 body('catalogId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('category not be empty'),
 handleValidation
];
module.exports={uploadProductValidation,updateProductValidation,registerValidation,loginValidation};