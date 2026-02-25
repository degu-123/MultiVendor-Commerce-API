
const {suspendStoreService,activateStoreService,addViolationService,getAllStoresService,getMyStoreService}=require('../services/storeService');

async function suspendStore(req, res, next) {
  try {
    const storeId  = req.params.id;
    const { reason } = req.body;

    const result = await suspendStoreService(
      storeId,
      req.user._id,
      reason
    );

    res.status(200).json({
      status:'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

async function activateStore(req, res, next) {
  try {
    const storeId = req.params.id;

    const result = await activateStoreService(storeId);

    res.status(200).json({
      status:'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

async function addViolation(req, res, next) {
  try {
    const storeId = req.params.id;
    const { reason } = req.body;

    const result = await addViolationService(
      storeId,
      reason,
      req.user._id
    );
    res.status(200).json({
      status:'success',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

async function getAllStores(req,res,next){
  try{
   const adminId=req.user._id; 
  const result=await getAllStoresService(req.query,adminId);
  res.status(200).json({
    status:"success",
    ...result
  })
  }catch(err){
    next(err)
  }
}

async function getMyStore(req,res,next){
  try{
    const userId=req.user._id;
    const result=await getMyStoreService(userId);
    res.status(200).json({
      status:"success",
      ...result
    })
  }catch(err){
    next(err)
  }
}
module.exports={suspendStore,activateStore,addViolation,
  getAllStores,
  getMyStore
};