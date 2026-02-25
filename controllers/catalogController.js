
const AppError=require('../utils/AppError');
const mongoose=require('mongoose');

const {createCatalogService,
getAllCatalogsService,updateCatalogStatus,
updateCatalogService
  }=require('../services/catalogService');

async function createCatalog(req, res, next) {
  try {
    const { name, description, parentId } = req.body;
 if(parentId){
  if (!mongoose.Types.ObjectId.isValid(parentId)) {
  return next(new AppError('Invalid category ID', 400));
} 
 }
    const result = await createCatalogService({
      name,
      description,
      parentId
    });

    res.status(201).json({
      status: 'success',
      ...result
    });

  } catch (err) {
    next(err);
  }
}
async function getAllCatalogs(req, res,next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 10, 1),
      50
    );
    let onlyActive;
if(req.user&&req.user.role !=='admin'&&req.user.role !=='superAdmin'){
  onlyActive=true;
}
    const result = await getAllCatalogsService(page, limit,onlyActive);

    res.status(200).json({
      status: 'success',
      ...result
    });

  } catch (err) {
    next(err);
  }
}

async function controlCatalog(req,res,next){
  try{
    const catalogId=req.params.id;
    const {status}=req.query;
  if (!mongoose.Types.ObjectId.isValid(catalogId)) {
  return next(new AppError('Invalid category ID', 400));
}
    const result=await updateCatalogStatus(catalogId,status);
    res.status(200).json({
      status:"success",
      ...result
    })
  }catch(err){
    next(err)
  }
}

async function updateCatalog(req, res, next) {
  try {
   const catalogId = req.params.id;
 // Only allow name and description fields
    const { name, description } = req.body;

  const result = await updateCatalogService(catalogId, { name, description });

    res.status(200).json({
      status:"success",
      ...result
    });
  } catch (err) {
    next(err);
  }
}

module.exports={
  createCatalog,getAllCatalogs,controlCatalog,updateCatalog
}