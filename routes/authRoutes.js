
const express=require('express');
const router=express.Router();

const {register,
login,refresh,
logout,verify,
  reset,
  forgot
}=require('../controllers/authController');
const {loginLimiter,
forgotLimiter,
registerLimiter,
refreshLimiter}=require('../middlewares/rateLimiter');

const {registerValidation,loginValidation}=require('../middlewares/validateMiddleware');



//create api endpoints
router.post('/register',registerLimiter,registerValidation,
register);
router.post('/login',loginLimiter,loginValidation,login);

router.post('/forgot-password',forgotLimiter, forgot)
router.post('/reset-password',reset);

router.post('/refresh',refreshLimiter,refresh);
router.post('/logout',logout);
router.get('/verify-email',verify);
module.exports=router;