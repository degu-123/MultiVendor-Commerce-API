
const AppError=require('../utils/AppError');
const mongoose=require('mongoose')
const {createProductService,updateProductService,
deleteProductService,banProductService,unbanProductService,getAllProductsService,
  getPublicProductsService,
  uploadImagesService,getSellerProductsService
}=require('../services/productService');

async function createProduct(req, res, next) {
  try {

    const result = await createProductService(
      req.body,
      req.user._id // seller ID
    );

    res.status(201).json({
      status:'success',
      ...result
    });

  } catch (err) {
    next(err);
  }
}
//upload product images
async function uploadImagesToProduct(req, res, next) {
  try {
    const product = await uploadImagesService(
      req.params.id,
      req.user._id,
      req.files
    );

    res.status(200).json({
      status: 'success',
      ...product
    });

  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
   try {
    const productId=req.params.id;
   
    if(productId){
  if (!mongoose.Types.ObjectId.isValid(productId)) {
  return next(new AppError('Invalid product ID', 400));
} 
 }
      const result = await updateProductService(
         productId,
         req.user._id,
         req.body
      );

      res.status(200).json({
        status:'success',
        ...result
      });

   } catch (err) {
      next(err);
   }
}
async function deleteProduct(req,res,next){
  try{
    const productId=req.params.id;
    const sellerId=req.user._id;
    if(productId){
  if (!mongoose.Types.ObjectId.isValid(productId)) {
  return next(new AppError('Invalid product ID', 400));
} 
 }
    
    const result=await deleteProductService(productId,sellerId);
    res.status(200).json({
      status:'success',
      ...result
    })
    
  }catch(err){
    next(err)
  }
}
async function getSellerProducts(req, res, next) {
   try {

 const page = Math.max(parseInt(req.query.page) || 1, 1);
 const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
 
      const result = await getSellerProductsService(
         req.user._id,
         {
            page,
            limit,
            search: req.query.search,
            isActive: req.query.isActive
         }
      );

      res.status(200).json({
         status: 'success',
         ...result
      });

   } catch (err) {
      next(err);
   }
}
//admin only functions
async function banProduct(req, res, next) {
   try {
  const productId=req.params.id
  
  if(productId){
  if (!mongoose.Types.ObjectId.isValid(productId)) {
  return next(new AppError('Invalid product ID', 400));
} 
 }      
     
 const result = await banProductService(
         productId,
         req.body.reason
      );

      res.status(200).json({
         status: 'success',
         message: 'Product banned successfully',
         ...result
      });

   } catch (err) {
      next(err);
   }
}

async function unbanProduct(req, res, next) {
   try {
     const productId=req.params.id
  if(productId){
  if (!mongoose.Types.ObjectId.isValid(productId)) {
  return next(new AppError('Invalid product ID', 400));
} 
 }   
      const result = await unbanProductService(productId);

      res.status(200).json({
         status: 'success',
         message: 'Product unbanned successfully',
         ...result
      });

   } catch (err) {
      next(err);
   }
}

async function getAllProducts(req, res, next) {
  try {
    const result = await getAllProductsService(req.query);

    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
}
async function getPublicProducts(req, res, next) {
  try {
    const result = await getPublicProductsService(req.query);

    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
}
module.exports = { updateProduct,createProduct,deleteProduct,
  getSellerProducts,banProduct,unbanProduct,getAllProducts
,getPublicProducts,
uploadImagesToProduct
};
