const AppError=require('../utils/AppError');
const Catalog=require('../models/catalogModel');

async function createCatalogService(data) {
  let { name, description, parentId } = data;

  if (!name || name.trim().length < 2) {
    throw new AppError(
      'Category name must be at least 2 characters',
      400
    );
  }
// Normalize name
  name = name.trim().toLowerCase();
  const existing = await Catalog.findOne({ name });
  if (existing) {
    throw new AppError('Category already exists', 400);
  }

  if (description) {
    description = description.trim();

    if (description.length < 10) {
      throw new AppError(
        'Description must be at least 10 characters',
        400
      );
    }
  }
// Validate parent category (if provided)
  if (parentId) {
    const parent = await Catalog.findById(parentId);

    if (!parent) {
      throw new AppError('Parent category not found', 404);
    }
  }

  const catalog = await Catalog.create({
    name,
    description,
    parentId: parentId || null
  });

  return{
    message:"catalog created successfully",
    category:{
      id:catalog._id,
      name:catalog.name,
      description:catalog.description
    }
};
}

async function getAllCatalogsService(page=1, limit=10,onlyActive=false) {
  const skip = (page - 1) * limit;
// Build query dynamically
  const query = {};
  if (onlyActive) {
    query.isActive = true;
  }

  const [catalogs, total] = await Promise.all([
    Catalog.find(query)
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .lean(), // performance optimization
    Catalog.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: catalogs,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}
async function updateCatalogStatus(catalogId, status) {
  const isActive=status==='true'

  const catalog = await Catalog.findByIdAndUpdate(
    catalogId,
    { isActive },
    { new: true }
  );

  if (!catalog) {
    throw new AppError('Category not found', 404);
  }

  return{
    message:"catalog status updated successfully",
    category:{
      id:catalog._id,
      name:catalog.name,
      description:catalog.description,
      isActive:catalog.isActive
    }
}
}
//update category
async function updateCatalogService(catalogId, data) {
  let { name, description } = data;

  if (!name && !description) {
    throw new AppError('Nothing to update', 400);
  }
 const updateData = {};
if (name) {
    name = name.trim().toLowerCase();
    if (name.length < 2) {
      throw new AppError('Category name must be at least 2 characters', 400);
    }
 // Check duplicate
    const existing = await Catalog.findOne({ name, _id: { $ne: catalogId } });
    if (existing) {
      throw new AppError('Category name already exists', 400);
    }
  updateData.name = name;
  }
 if (description) {
    description = description.trim();
    if (description.length < 10) {
      throw new AppError('Description must be at least 10 characters', 400);
    }
    updateData.description = description;
  }

  const catalog = await Catalog.findByIdAndUpdate(catalogId, updateData, { new: true });

  if (!catalog) {
    throw new AppError('Category not found', 404);
  }

  return {
    message: 'Catalog updated successfully',
    category: {
      id: catalog._id,
      name: catalog.name,
      description: catalog.description,
      isActive: catalog.isActive
    }
  };
}

module.exports={
  createCatalogService,getAllCatalogsService,updateCatalogStatus,updateCatalogService
};