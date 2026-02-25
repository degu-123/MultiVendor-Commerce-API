const User=require('../models/userModel');
const crypto = require('crypto');
const AppError=require('../utils/AppError');
const sendEmail=require('../utils/sendEmail');
const isStrongPassword=require('../utils/passwordCheck');
const {comparePassword,generateAccessToken,generateRefreshToken,
  verifyRefreshToken,
  hashToken,compareToken
}=require('../utils/token');

//user register service
async function registerUser(userData){
  const {name,email,password}=userData;
  const emailexists=await User.findOne({email});
  if(emailexists)throw new AppError('email already exists',400);
 const token = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  let role = 'customer';
const adminExists = await User.exists({ role: 'admin' });
if (!adminExists && email === process.env.SUPER_ADMIN_EMAIL) {
  role = 'admin';
}
  const user=await User.create({
    name,
    email,
   password,
   role,
   emailVerifyToken:hashedToken,
   emailVerifyTokenExpires:Date.now()+10*60*1000
  });

  const verifyUrl = `http://localhost:3000/api/v1/auth/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email',
    html: `<p>Click this link to verify your email:</p><a href="${verifyUrl}">Verify Email</a>`,
  });
  return{
    message: 'Registration successful. Verify email.',
      user: {
         id: user._id,
         name: user.name,
         email: user.email
      }
  };
}

//eail verify service
async function verifyEmail(token) {
 
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  const user = await User.findOne({
    emailVerifyToken:hashedToken,
    emailVerifyTokenExpires: { $gt: Date.now() }, // check not expired
  });

  if (!user) throw new AppError('Invalid or expired token',401);

  user.isVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyTokenExpires = undefined;

  await user.save();

  return{ message:'Email verified successfully!',
  user:{
    id:user._id,
    email:user.email,
    name:user.name,
    isVerified:user.isVerified
  }
};
}
//user login service
async function loginUser({email,password},ip,device){

  const user=await User.findOne({email}).select('+password +refreshTokens');

  if(!user)throw new AppError('Invalid password or email',401);
  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new AppError(`Account is locked for ${user.lockUntil}`, 403);
  }
  const isMatch=await comparePassword(password,user.password);
  
  if (!isMatch) {
  user.loginFailedAttempts += 1;

  if (user.loginFailedAttempts >= 5) {
    user.lockUntil = Date.now() + 30 * 60 * 1000; // 5 minutes
  }
  await user.save({ validateBeforeSave: false });
 throw new AppError('Invalid email or password', 401);
}
  // 3. Successful login
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;

  //check account status
  if (user.isDeleted)throw new AppError('Account is deleted', 403);
  if (user.isBanned) throw new AppError('Account is banned', 403);
  
  if (!user.isVerified){
    throw new AppError('Please verify your email first.',403);
  }
  
  //generate tokens
  const accessToken=generateAccessToken(user._id,user.role);
  const refreshToken=generateRefreshToken(user._id);
  //hash refresh token save as array
  const hashedToken=await hashToken(refreshToken);
  if (user.refreshTokens.length > 5) {
  user.refreshTokens.shift(); 
    };
    
  user.refreshTokens.push({token:hashedToken,
  ip,
  device,
  createdAt:new Date()});
  await user.save();
  
  return{
    message:"login successfully",
    user:{
      id:user._id,
      name:user.name,
      email:user.email,
      role:user.role
    },
    accessToken:accessToken,
    refreshToken:refreshToken
  };
}

async function refreshAccessToken(refreshToken,ip,device) {
  let decoded;
  try {
 decoded = verifyRefreshToken(refreshToken);
  }catch(err){
    throw new AppError('Invalid or expired refresh token',401)
  }
    if (!decoded ||!decoded.id) {
      throw new AppError('Invalid refresh token', 401)
    };
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }
    if (!user.refreshTokens||user.refreshTokens.length===0) {
  throw new AppError('No refresh token stored. Please login again.', 401);
}
if(user.isDeleted)throw new AppError('Account is deleted',403)
  if (user.isBanned) {
      throw new AppError('Account is banned', 403)
    }
  if(!user.isVerified)throw new AppError('Email is not verified',403)  
    // Password changed after token issued?
    if (user.passwordChangedAfter(decoded.iat)) {
      throw new AppError('Password changed recently, please login again', 401);
    }
    //hash token and find from db
    
  const hashIncoming=await hashToken(refreshToken);
  const tokenIndex = user.refreshTokens.findIndex(
    t => t.token === hashIncoming
  );

  if (tokenIndex === -1) {
    // 🔥 Possible token reuse attack
    await user.save({ validateBeforeSave: false });
    throw new AppError('Refresh token reuse detected. Please login again.', 403);
  }
 // Remove old refresh token (rotation)
  user.refreshTokens.splice(tokenIndex, 1);

  const newrefreshToken=generateRefreshToken(user._id);
  const hashedToken=await hashToken(newrefreshToken);
  user.refreshTokens.push({
    token:hashedToken,
  ip,
  device,
  createdAt: new Date()  
  });
  
  if(user.refreshTokens.length >5){
    user.refreshTokens.shift()
  }
  // save in db
  await user.save({validateBeforeSave: false})
  const accessToken = generateAccessToken(user._id,user.role);
 return{
   message:"refreshed access token successfully",
   accessToken:accessToken,
   refreshToken:newrefreshToken
 }
}
//logout service layer
async function logoutUser(refreshToken) {
 let decoded;
try {
  decoded = verifyRefreshToken(refreshToken);
} catch (err) {
  throw new AppError('Invalid or expired refresh token', 401);
}
    if (!decoded || !decoded.id) {
      throw new AppError('Invalid refresh token', 401);
    }
  const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) {
      throw new AppError('User not found', 404);
    }
  const hashIncoming=await hashToken(refreshToken);
  
 const tokenIndex=user.refreshTokens.findIndex(t=>t.token === hashIncoming);
 if(tokenIndex === -1){
 return { message: "Already logged out" }
 }
  // Invalidate refresh token
    user.refreshTokens.splice(tokenIndex,1)
    await user.save({ validateBeforeSave: false });
 return{
   message:"logout successfully",
   user:{
     id:user._id,
     name:user.name,
     email:user.email
   }
 };
}
async function forgotPassword(email){
  const user=await User.findOne({email});
  if (!user) {
    return {
      message: "If an account exists, reset link sent."
    };
  }
  
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(resetToken)
  user.passwordResetToken=hashedToken;
  user.passwordResetTokenExpires=Date.now()+10*60*1000;
  await user.save({ validateBeforeSave: false });
  
 const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;
try{
await sendEmail({
  to: user.email,
  subject: 'Reset Your Password',
  html: `
    <p>You requested a password reset.</p>
    <a href="${resetUrl}">Reset Password</a>
  `,
});
}catch(err){
  user.passwordResetToken = undefined;
 user.passwordResetTokenExpires = undefined;
 
  await user.save({ validateBeforeSave: false });
  throw new AppError('Email sending failed', 500);
}
return{
  message: "If an account exists, reset link sent."
}

}
async function resetPassword(token,password) {
  if (!token || !password) {
    throw new AppError('Token and password required', 400);
  }
  const hashIncoming=hashToken(token)
 const user = await User.findOne({
      passwordResetToken: hashIncoming,
      passwordResetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Reset link is invalid or expired', 400);
    }

    // Update password
    if(!isStrongPassword(password))throw new AppError('password too weak,Include uppercase,lowercase,number,special charcters',400);
   
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
user.refreshTokens=[];
    await user.save();

    return{
      message: 'Password reset successful. You can now log in.',
    }
}

module.exports={registerUser,verifyEmail,loginUser,refreshAccessToken,logoutUser,forgotPassword,resetPassword};
