const multer=require('multer');
const path=require('path');
const AppError=require('../utils/AppError');

//upload profile image 
const storageAvatar=multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'uploads/avatars');
  },
  filename:(req,file,cb)=>{
    const ext=path.extname(file.originalname).toLowerCase();
    const filename=`user-${req.user.id}-${Date.now()}${ext}`;
    cb(null,filename);
  }
});
const fileFilterAvatar=(req,file,cb)=>{
  if(file.mimetype.startsWith('image/')){
    cb(null,true)
  }else{
    cb(new AppError('only image file allowed(png,jpg)',400),false);
  }
};
const uploadAvatar=multer({
  storage: storageAvatar, 
  fileFilter: fileFilterAvatar, 
  limits:{fileSize:1024*1024*2}
}).single('avatar');

//upload arrays images for products
const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const fileFilterProduct = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files allowed', 400), false);
  }
};

const uploadProductImages = multer({
    storage:storageProduct,
    fileFilter:fileFilterProduct,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per image
  }
}).any('images',5);

module.exports={uploadAvatar,uploadProductImages};
