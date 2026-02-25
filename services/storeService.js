const AppError=require('../utils/AppError');
const Store=require('../models/storeModel');
const User=require('../models/userModel');
async function suspendStoreService(storeId, adminId, reason) {
  if (!reason || reason.trim().length < 10) {
    throw new AppError('Suspension reason must be at least 10 characters', 400);
  }

  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  if (store.status !== 'active') {
    throw new AppError('Store is already suspended', 400);
  }

  store.status = 'suspended';
  store.suspension = {
    reason: reason.trim(),
    suspendedAt: new Date(),
    suspendedBy: adminId
  };

  await store.save();

  return {
    message: 'Store suspended successfully',
    storeId: store._id,
    suspendedAt: store.suspension.suspendedAt
  };
}
//activate store
async function activateStoreService(storeId) {
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('Store not found', 404);
  }
  if (store.status !== 'suspended') {
    throw new AppError('Store is not suspended', 400);
  }
  store.status = 'active';
  store.suspension = undefined;

  await store.save();
 return {
    message: 'Store activated successfully',
    storeId: store._id
  };
}

async function addViolationService(storeId, reason, adminId) {
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  store.violationCount = (store.violationCount || 0) + 1;
  // Auto suspend after 3 violations
  
  if (store.violationCount >= 3 && store.status !== 'suspended') {

    const suspensionDays = 7; // suspend for 7 days

    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + suspensionDays);

    store.status = 'suspended';

    store.suspension = {
      reason: 'Auto suspension: 3 violations reached',
      suspendedAt: new Date(),
      suspendedUntil: untilDate,
      suspendedBy: adminId,
      isAuto: true
    };
  }

  await store.save();

  return {
    message: 'Violation recorded',
totalViolations:store.violationCount,
    status: store.status
  };
}

async function getAllStoresService(queryParams,adminId) {
const page = Math.max(parseInt(queryParams.page) || 1, 1);
 const limit = Math.min(Math.max(parseInt(queryParams.limit) || 10, 1), 50);

const user=await User.findById(adminId);
if(!user)throw new AppError('User not found',404);
if(user.role !=='admin'&& user.role !=='superAdmin')throw new AppError('Only allowed for admin and super admin only',403)

  const filter = {};

  if (queryParams.status) {
    filter.status = queryParams.status;
  }
  const skip = (page - 1) * limit;

  const [stores,total] = await Promise.all([
 Store.find(filter)
    .skip(skip)
    .limit(Number(limit))
    .sort({createdAt:-1})
    .lean(),
 Store.countDocuments(filter)
 ]);
 const totalpages=Math.ceil(total/limit);
 
  return {
    pagination:{
      total,
      totalpages,
      page,
      limit,
      hasNextPage:page<totalpages,
      hasPrevPage:page>1
    },
    stores
  };
}

async function getMyStoreService(userId) {
  const store = await Store.findOne({ ownerId: userId });

  if (!store) {
    throw new AppError('Store not found', 404);
  }
  return{
    store:store
  };
}
module.exports={suspendStoreService,activateStoreService,addViolationService,getAllStoresService,getMyStoreService};