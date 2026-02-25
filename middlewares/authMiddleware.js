const User=require('../models/userModel');
const AppError=require('../utils/AppError');
const {verifyAccessToken}=require('../utils/token');
const protectRoute=async(req,res,next)=>{
 try{
  const authheader=req.headers.authorization;
  if(!authheader||!authheader.startsWith('Bearer '))return next(new AppError('No token sent',401));
  const token=authheader.split(' ')[1];
  if(!token)return next(new AppError('Invalid token format',401));
  const decoded=verifyAccessToken(token);
  if (!decoded || !decoded.id) {
      return next(new AppError('Invalid token payload', 401));
    }
  const user=await User.findById(decoded.id).select('-password');
  if (!user) {
      return next(new AppError('User no longer exists', 401));
    }
  if(user.isDeleted){
    return next(new AppError('user account is deleted',403))
  }
    if (user.isBanned) {
  return next(new AppError('User account is banned', 403));
}
    if (user.passwordChangedAfter(decoded.iat)) {
  return next(
    new AppError('Password changed recently. Please login again.', 401)
  );
}
  req.user=user
  next()
 }
 catch(err){
   if(err.name==='TokenExpiredError'){
     return next(new AppError('Access token is expired',401));
   };
   if(err.name==='JsonWebTokenError'){
   return next(new AppError('Invalid access token',401));
   };
   
   return next(err)
 }
}
module.exports=protectRoute;