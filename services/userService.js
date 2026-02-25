const fs=require('fs');
const path=require('path');
const User=require('../models/userModel');
const logger=require('../utils/logger');
const AppError=require('../utils/AppError');
const {comparePassword}=require('../utils/token');
const isStrongPassword=require('../utils/passwordCheck');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

function viewProfile(user){
  
if(!user)throw new AppError('user does not exists',404);
  return{
    message:'profile page',
    user:{
      id:user._id,
      name:user.name,
      email:user.email,
      image:user.avatar
    }
  };
}

async function updateProfile(data, user) {

  if (!user) throw new AppError('No user found', 404);

  const allowedFields = ['name', 'email', 'phone'];
  const filteredData = {};
     // Filter allowed fields
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      filteredData[field] = data[field];
    }
  });

  if (Object.keys(filteredData).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }
  if (filteredData.email && filteredData.email !== user.email) {
    const existingUser = await User.findOne({ email: filteredData.email });
    if (existingUser) {
      throw new AppError('Email is already in use by another account', 400);
    }
  }

 // Detect email change BEFORE applying update
  const emailChanged =
    filteredData.email && filteredData.email !== user.email;
  Object.assign(user, filteredData);
  let token;
 if (emailChanged) {
    user.isVerified = false;
 // Invalidate all existing tokens
    user.passwordChangedAt = Date.now();
// Generate verification token
token = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    user.emailVerifyToken = hashedToken;
  user.emailVerifyTokenExpires = Date.now()+10*60*1000;
  }
  await user.save({ validateBeforeSave: true });
 // Send verification email 
  if (emailChanged) {
    const verifyUrl = `http://localhost:3000/api/v1/auth/verify-email?token=${token}`;

  try {
      await sendEmail({
        to: filteredData.email,
        subject: 'Verify Your Email',
        html: `<p>Click this link to verify your email:</p><a href="${verifyUrl}">Verify Email</a>`,
      });
    } catch (err) {
      throw new AppError('Profile updated but failed to send verification email. Try again later.', 500);
    }

    return {
      message:
        'Profile updated. Please verify your new email and login again.'
    };
  }

  return {
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  };
}
async function updatePassword(userId,currentPassword,newPassword){
  const user=await User.findById(userId).select('+password')
    if(!user)throw new AppError('no user exists',404);
    if(!currentPassword||!newPassword)throw new AppError('current password and new password required ',400);
  
const isMatch=await comparePassword(currentPassword,user.password);
if(!isMatch)throw new AppError('current password is incorrect',401);
//check password strength
if(!isStrongPassword(newPassword))throw new AppError('password too weak,Include uppercase,lowercase,number,special charcters',400);
 user.password=newPassword;
    await user.save();
    return{
      message:"password updated successfully"
    };
}
async function saveUpload(profile,user,baseUrl){
  if(!profile)throw new AppError('No file is uploaded',400);
  
  if(!user)throw new AppError('No user found',404);
  if (!profile.mimetype.startsWith('image/'))
    throw new AppError('Only image files allowed', 400);

  if (user.avatar?.path) {
    const oldPath = path.resolve(user.avatar.path);
    try {
      await fs.promises.unlink(oldPath);
    } catch (err) {
      // ignore if file not found
    }
  }
console.log(profile,baseUrl);
  user.avatar={
    filename:profile.filename,
    path:profile.path,
    mimetype:profile.mimetype,
    size:profile.size
  };
  await user.save({validateBeforeSave:false});
const avatarUrl = `${baseUrl}/${profile.path.replace(/\\/g, '/')}`;

 return{
      message: 'Avatar uploaded successfully',
      url:avatarUrl
    };
  }
  //admin onlly functions 
  
  async function banUser(userId,adminId){
 const adminUser=await User.findById(adminId);
 
if (userId.toString() ===adminId.toString()) {
    throw new AppError('cannot ban himself', 400);
  }
  //protect admin from another admin
const targetUser = await User.findById(userId);
if (!targetUser) throw new AppError('User not found', 404);

if(targetUser.isBanned)throw new AppError('Account already banned',403);

// Role hierarchy system

  const roleLevel = {
    customer: 1,
    seller: 2,
    admin: 3,
    superAdmin: 4
  };

  if (roleLevel[adminUser.role] <= roleLevel[targetUser.role]) {
    throw new AppError('You are not allowed to ban this user', 403);
  }

const user = await User.findOneAndUpdate(
  { _id: userId, isDeleted: false },
  { isBanned: true },
  { new: true }
);
  if(!user)throw new AppError('No user is exists',404);
  return{
    message:'User banned temporarely',
    user:{
      id:user._id,
      name:user.name,
      email:user.email,
      isBanned:user.isBanned
    }
  };
}
async function makeAdminUser(userId) {
   const user = await User.findOne({_id:userId,isDeleted:false});
  if (!user) throw new AppError('User not found', 404);
  if(user.isBanned)throw new AppError('Banned account can not be admin',403);

  if (user.role === 'admin') {
    throw new AppError('User is already an admin', 400);
  }

  user.role = 'admin';
  await user.save();
  return{
    message: 'User promoted to be admin',
    user:{
      id:user._id,
      name:user.name,
      email:user.email,
      role:user.role
    }
};
}
async function adminViewUsers(page=1,limit=10){
 const skip=(page-1)*limit;
 
  const [viewUsers,totalUsers] =await Promise.all([
     User.find()
     .sort({createdAt:-1})
      .skip(skip)
      .limit(limit)
      .lean(),
      User.countDocuments()
    ])   
   const totalPages=Math.ceil(totalUsers/limit)
   
    if(!viewUsers||viewUsers.length===0){
  return {
  results: viewUsers.length,
  pagination: {
  },
  users: viewUsers
};
    }
    return{
      results:viewUsers.length,
      pagination:{
      totalUsers,  
      totalPage:totalPages,
      currentPage:page,
      limit,
      hasNextPage:page<totalPages,
     hasPrevPage:page>1
      },
      users:viewUsers
    };
  }

async function deleteUser(userId,adminId){
  const adminUser=await User.findById(adminId);
  if (userId.toString() === adminId.toString()) {
    throw new AppError('cannot delete himself', 400);
  }
const targetUser=await User.findById(userId);
if(!targetUser)throw new AppError('User not found',404);
//role level hierarchy

const roleLevel = {
    customer: 1,
    seller: 2,
    admin: 3,
    superAdmin: 4
  };

  if (roleLevel[adminUser.role] <= roleLevel[targetUser.role]) {
    throw new AppError('You are not allowed to delete this user', 403);
  }

  const user = await User.findOneAndUpdate(
  { _id: userId, isDeleted: false },
  { isDeleted: true },
  { new: true }
);
  if (!user) {
    throw new AppError('User not found', 404); 
       };
   return{
     message:'User is deleted successfully',
     user:{
       id:user._id,
       name:user.name,
       email:user.email,
       isDeleted:user.isDeleted
     }
   };    
}
  
  module.exports={viewProfile,updateProfile,updatePassword,saveUpload,banUser,deleteUser,makeAdminUser,adminViewUsers};