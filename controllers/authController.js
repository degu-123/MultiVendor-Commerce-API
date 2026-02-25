const AppError=require('../utils/AppError');
const { registerUser,verifyEmail,loginUser,refreshAccessToken,logoutUser,forgotPassword,resetPassword} = require('../services/authService');

//register controller
async function register(req, res, next){
   try {
      const result = await registerUser(req.body);

      res.status(201).json({
         status: 'success',
         ...result
      });

   } catch (error) {
      next(error);
   }
};
//email verify controller
async function verify(req,res,next){
  try{
    const {token}=req.query;
    if(!token)return next(new AppError('Token is missing',400));
    
      const result=await verifyEmail(token)
      res.status(200).json({
        status:"success",
        ...result
      });
    }catch(error){
      next(error)
    }
  }
  //login controller
  async function login(req,res,next){
    try{
    const ip = req.ip;
    const device = req.headers['user-agent'];
      const result=await loginUser(req.body,ip,device);
      res.status(200).json({
        status:"success",
        ...result
      })
    }catch(error){
      next(error)
    }
  }
  
  async function refresh(req,res,next){
    try{
   const {refreshToken}=req.body   
    const ip = req.ip;
    const device = req.headers['user-agent'];
    console.log('device info',ip,device)
   if(!refreshToken)return next(new AppError('refreshToken is required',400));
   const result=await refreshAccessToken(refreshToken,ip,device);
   res.status(200).json({
     status:"success",
     ...result
   })
    }catch(err){
      next(err)
    }
  }
  async function logout(req,res,next){
    try{
      const {refreshToken}=req.body;
      if(!refreshToken)return next(new AppError('refreshToken is required',400));
      const result=await logoutUser(refreshToken);
      res.status(200).json({
        status:'success',
        ...result
      });
    }catch(err){
      next(err)
    }
  }
  async function forgot(req,res,next){
    try{
      const {email}=req.body;
      if(!email)return next(new AppError('email is required',400));
      const result=await forgotPassword(email)
      res.status(200).json({
        status:"success",
        ...result
      })
    }catch(err){
      next(err)
    }
  }
  async function reset(req,res,next){
    try{
      const {token,password}=req.body;
      if(!token||!password)return next(new AppError('token or password is missing',400));
      const result =await resetPassword(token,password);
      res.status(200).json({
        status:"success",
        ...result
      })
    }catch(err){
     next(err)
    }
  }
  module.exports={register,verify,login,logout,forgot,reset,refresh}