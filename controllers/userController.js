
const AppError=require('../utils/AppError');
const mongoose=require('mongoose');
const {viewProfile,
updateProfile,
updatePassword,
saveUpload,banUser,
deleteUser,makeAdminUser,adminViewUsers
}=require('../services/userService');

async function getMe(req,res,next){
  try{
    const user=req.user;
    if(!user)return next(new AppError('users not found',404));
    const result=viewProfile(user)
    res.status(200).json({
      status:"success",
      ...result
    })
  }catch(err){
    next(err)
  }
}

async function updateMe(req,res,next){
  try{
    const user=req.user;
    const data=req.body;
    if(!data)return next(new AppError('update data is required',400));
    const result=await updateProfile(data,user);
    res.status(200).json({
      status:"success",
      ...result
    })
  }catch(err){
    next(err)
  }
}
async function changePassword(req,res,next){
  try{
    const {currentPassword,newPassword}=req.body;
    const userId=req.user._id;
    const result=await updatePassword(userId,currentPassword,newPassword);
    res.status(200).json({
      status:'success',
      ...result
    })
  }catch(err){
    next(err)
  }
}
async function uploadProfile(req,res,next){
 try{
   const user=req.user;
   if(!req.file)return next(new AppError('No image data is found',400));
   if(!user)return next(new AppError('No users found',404));
   
   const baseUrl = `${req.protocol}://${req.get('host')}`;
   const result=await saveUpload(req.file,user,baseUrl);
  
   res.status(200).json({
     status:"success",
     ...result
   })
 }catch(err){
   next(err)
 }
}
//admin only user controller functions(restricted to admin)

async function banAccount(req,res,next){
  try{
    const userId=req.params.id;
if (!mongoose.Types.ObjectId.isValid(userId)) {
return  next(new AppError('Invalid user ID', 400));
} 
  const result=await banUser(userId,req.user._id);
  res.status(200).json({
    status:"success",
    ...result
  })
  }catch(err){
    next(err)
  }
}
//delete user account 
async function deleteAccount(req,res,next){
  try{
 const userId=req.params.id;
if (!mongoose.Types.ObjectId.isValid(userId)) {
return  next(new AppError('Invalid user ID', 400));
}
const result=await deleteUser(userId,req.user._id);
res.status(200).json({
  status:'success',
  ...result
})
  }catch(err){
    next(err)
  }
}
//make customer/seller admin
async function makeAdmin(req,res,next){
  try{
    const userId=req.params.id;
   if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
return  next(new AppError('Invalid user ID', 400));
};
const result=await makeAdminUser(userId);
  res.status(200).json({
    status:'success',
    ...result
  })
  }catch(err){
    next(err)
  }
}
//admin all users 
async function viewUsers(req,res,next){
  try{
  const page=Math.max(parseInt(req.query.page)||1,1);
 const limit=Math.min(parseInt(req.query.limit)||10,50);
 const result=await adminViewUsers(page,limit);
 res.status(200).json({
   status:'success',
   ...result
 })
  }catch(err){
    next(err)
  }
}
module.exports={getMe,updateMe,uploadProfile,changePassword,
  banAccount,deleteAccount,makeAdmin,viewUsers
}