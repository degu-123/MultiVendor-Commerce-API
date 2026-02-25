// services/sellerService.js
const mongoose = require('mongoose');
const Store = require('../models/storeModel');
const SellerApplication = require('../models/sellerApplicationModel');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');

async function applyForSellerService(user, data) {
  if (!user) throw new AppError('User not found', 404);

  if (user.role === 'seller') {
    throw new AppError('You already own a store.', 400);
  }
  if (user.role === 'admin'||user.role==='superAdmin') {
    throw new AppError('Only customer apply for astore.', 400);
  }
  //  Prevent multiple pending
  const pending = await SellerApplication.findOne({
    user: user._id,
    status: 'pending'
  });

  if (pending) {
    throw new AppError('Your previous application is under review.', 400);
  }

  // ⏳ Count applications in last 30 days
  const oneMonthAgo = new Date(Date.now() - 30*24*60*60*1000);
  const recentApplicationsCount = await SellerApplication.countDocuments({
    user: user._id,
    createdAt: { $gte: oneMonthAgo }
  });

  if (recentApplicationsCount >= 5) {
    throw new AppError(
      'You cannot apply to become a seller more than 5 times in the last month.',
      403
    );
  }

  // Create new application
  const newApplication = await SellerApplication.create({
    user: user._id,
    ...data
  });

  return{
  message: 'Application submitted successfully',
  application: newApplication
  };
}
async function getSellerApplicationHistory(user, page = 1, limit = 5) {
  if (!user) throw new AppError('User not found', 404);

const skip = (page - 1) * limit;
// Fetch paginated applications
  const applications = await SellerApplication.find({ user: user._id })
    .sort({ createdAt: -1 }) // newest first
    .skip(skip)
    .limit(limit)
    .select(
      'storeName storeDescription businessEmail phone address taxId status rejectionReason reviewedBy reviewedAt createdAt updatedAt'
    )
    .populate({
      path: 'reviewedBy',
      select: 'name email role' // admin info
    })
    .lean();
 // Count total applications for pagination info
  const totalApplications = await SellerApplication.countDocuments({ user: user._id });
  const totalPages = Math.ceil(totalApplications / limit);

  return {
    applications,
    pagination: {
      page,
      limit,
      totalPages,
      totalApplications
    }
  };
}
//admin functions to sellerApplication from customer

async function getPendingApplications(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [applications,totalApplications] = await Promise.all([SellerApplication.find({ status: 'pending' })
    .sort({ createdAt: 1 }) // oldest first
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'user',
      select: 'name email role'
    }),
    SellerApplication.countDocuments({ status: 'pending' })
    ])
  const totalPages = Math.ceil(totalApplications / limit);

  return { applications, pagination: { page, limit, totalPages, totalApplications } };
}
 //Approve a seller application
async function approveApplication(adminId, applicationId) {
  const session = await mongoose.startSession();
  session.startTransaction();
const adminUser = await User.findById(adminId);
if (!adminUser || !['admin','superAdmin'].includes(adminUser.role)) {
  throw new AppError('Not authorized to approve application', 403);
}
const targetApp=await SellerApplication.findById(applicationId);
if(!targetApp)throw new AppError('application not found');
const storeNameexists=await Store.findOne({name:targetApp.storeName});
if(storeNameexists)throw new AppError('Store name already exists')
  try {
    // Atomic state transition (prevents race condition)
const app = await SellerApplication.findOneAndUpdate(
      { _id: applicationId, status: 'pending' }, // condition
      {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date()
      },
      { new: true, session }
    );
console.log('application',app)
    if (!app) {
      throw new AppError(
        'Application not found or already processed',
        400
      );
    }
 // Update user role inside same transaction
    const updatedUser = await User.findByIdAndUpdate(
      app.user,
      { role: 'seller' },
      { new: true, session }
    );
if (!updatedUser) {
      throw new AppError('Associated user not found', 404);
    }
  const store = await Store.create(
      [ 
        {
    
          ownerId: app.user,
          applicationId: app._id,
          name: app.storeName,
          description: app.storeDescription,
          isActive: true,
          isBanned: false,
          tags: app.tags || [] 
        }],
      { session }
    );  
 // Commit transaction (both succeed together)
    await session.commitTransaction();
    session.endSession();
        return{
          app,
          store
        };
 } catch (error) {
   // Rollback everything if error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}
 // Reject a seller application
async function rejectApplication(adminId, applicationId, reason) {
  const app = await SellerApplication.findById(applicationId).populate({
    path:'user',
  select:'_id role'
  });
  if (!app) throw new AppError('Application not found', 404);
  if (app.status !== 'pending') throw new AppError('Only pending applications can be rejected', 400);

  app.status = 'rejected';
  app.rejectionReason = reason || 'No reason provided';
  app.reviewedBy = adminId;
  app.reviewedAt = new Date();

   const updatedApp = await app.save();
   return {
  message: 'Application rejected successfully',
  application: {
    id: updatedApp._id,
    storeName: updatedApp.storeName,
    status: updatedApp.status,
    rejectionReason: updatedApp.rejectionReason,
    reviewedAt: updatedApp.reviewedAt
  }
};
}


module.exports = { getSellerApplicationHistory,applyForSellerService,getPendingApplications,approveApplication,rejectApplication};
