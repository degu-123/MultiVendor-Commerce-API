const rateLimit=require('express-rate-limit');
const globalLimiter=rateLimit({
  windowMs:15*60*1000,
  max:100,
  message:'Too many requests try again later'
});
const loginLimiter=rateLimit({
  windowMs:15*60*1000,
  max:15,
  message:'Too many login attempts try again later'
});
const forgotLimiter=rateLimit({
  windowMs:1*60*60*1000,
  max:3,
  message:'Too many forgot attempts try again later'
});
const registerLimiter=rateLimit({
  windowMs:1*60*60*1000,
  max:5,
  message:'Too many register requests try again later'
});
const refreshLimiter=rateLimit({
  windowMs:15*60*1000,
  max:20,
  message:'Too many login attempts try again later'
});
module.exports={globalLimiter,loginLimiter,forgotLimiter,registerLimiter,refreshLimiter};