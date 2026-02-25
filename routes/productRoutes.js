const express = require('express');
const router = express.Router();
const protectRoute= require('../middlewares/authMiddleware');
const restrictTo=require('../middlewares/roleMiddleware');

const { updateProduct,
createProduct,
deleteProduct,
  getSellerProducts,
  banProduct,
  unbanProduct,
  getAllProducts,
  getPublicProducts,
  uploadImagesToProduct
}=require('../controllers/productController');

const {uploadProductValidation,updateProductValidation}=require('../middlewares/validateMiddleware');
const {uploadProductImages} = require('../middlewares/multerMiddleware');
//product public route
router.get('/', getPublicProducts);

router.use(protectRoute)
//seller only routes
router.post('/',uploadProductValidation,
restrictTo('seller'),
createProduct);

router.get('/my-products',
restrictTo('seller'),
getSellerProducts)

router.patch('/:id',
restrictTo('seller'),
updateProductValidation,
updateProduct);

router.delete('/:id',
restrictTo('seller'),
deleteProduct);

router.post(
  '/:id/images',
  restrictTo('seller'),
  uploadProductImages,
  uploadImagesToProduct
);
//admin only routes
router.get(
  '/all',
  restrictTo('admin','superAdmin'),
  getAllProducts
);
router.patch(
   '/:id/ban',
   restrictTo('admin','superAdmin'),
   banProduct
);

router.patch(
   '/:id/unban',
   restrictTo('admin','superAdmin'),
   unbanProduct
);



module.exports=router;