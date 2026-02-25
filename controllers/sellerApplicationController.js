const AppError = require('../utils/AppError');

const mongoose=require('mongoose');

const { 
  getSellerApplicationHistory ,applyForSellerService,
  getPendingApplications,approveApplication,rejectApplication
} = require('../services/sellerApplicationService');


async function applyForSeller(req, res, next){
  try {
 const result = await applyForSellerService(
      req.user,
      req.body
    );
    
    res.status(201).json({
      status: 'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
};
async function viewMyApplications(req, res, next) {
  try {
    const user = req.user; // from auth middleware
    if (!user) return next(new AppError('User not found', 404));
 const page = parseInt(req.query.page) || 1;
    const limit = 5; // fixed per your request
  const result = await getSellerApplicationHistory(user, page, limit);

    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
}
//admin only seller controller functions

async function viewPendingApplications(req, res, next) {
  try {
 const page = Math.max(parseInt(req.query.page) || 1, 1);
 const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
 const result = await getPendingApplications(page, limit);

 res.status(200).json({ status: 'success',
 ...result 
 });
  } catch (err) {
    next(err);
  }
}

async function approveSeller(req, res, next) {
  try {
    const adminId = req.user._id;
    const applicationId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
 return next(new AppError('Invalid application ID', 400));
}   
const result = await approveApplication(adminId, applicationId);

res.status(200).json({ status: 'success',
  ...result 
});
  } catch (err) {
    next(err);
  }
}

async function rejectSeller(req, res, next) {
  try {
    const adminId = req.user._id;
    const applicationId = req.params.id;
    const { reason } = req.body;
    //check application id
   if (!mongoose.Types.ObjectId.isValid(applicationId)) {
return  next(new AppError('Invalid application ID', 400));
} 
 if (!reason || reason.trim().length < 5) {
 return next(new AppError('Rejection reason must be at least 5 characters', 400));
}

const result = await rejectApplication(adminId, applicationId, reason);

  res.status(200).json({ status: 'success',
    ...result 
  });
  } catch (err) {
    next(err);
  }
}
module.exports = { viewMyApplications,
   applyForSeller,
  viewPendingApplications,
   approveSeller,
   rejectSeller 
};