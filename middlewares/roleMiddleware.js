const AppError=require('../utils/AppError');
function restrictTo(...roles){
  return (req,res,next)=>{
    if(!req.user||!req.user.role){
      return next(new AppError('Not authenticated',401));
    }
    if(!roles.includes(req.user.role)){return next(new AppError('forbidden',403));
    }
    next()
  }
}


module.exports=restrictTo