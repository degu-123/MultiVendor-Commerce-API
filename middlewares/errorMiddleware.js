const logger=require('../utils/logger');
const multer=require('multer');
 function globalErrorMiddleware(err,req,res,next){
   const status=err.status||'error'
   const statusCode=err.statusCode||500
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: "fail",
        message: "File too large. Max size is 2MB."
      });
    }
  } 
   
   if(err.isOperational){
     //custom error message
    res.status(statusCode).json({
       status,
       message:err.message,
       error:err.errors
     });
   }
   else{
     //program error
     logger.error(err);
      res.status(500).json({
       message:"something went wrong!",
       status:"error"
     })
   }
 }
 module.exports=globalErrorMiddleware;