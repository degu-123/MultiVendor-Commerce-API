const AppError=require('../utils/AppError');
const Product=require('../models/productModel');
const Store = require('../models/storeModel');
const Catalog=require('../models/catalogModel');

const {generateProductDescription,generateProductTags,
  getEmbedding
} = require("./aiService");
const filterObject=require('../utils/filterObject');

async function createProductService(data, sellerId) {

  const {
    catalogId,
    name,
    description,
    costPrice,
    sellingPrice,
    stock
  } = data;

  //  Find seller store automatically
  const store = await Store.findOne({ ownerId: sellerId });

  if (!store) {
    throw new AppError('Seller store not found', 404);
  }

  //  Check store status
  if (store.status !== 'active') {
    throw new AppError('Store is suspended', 403);
  }

  //  Validate catalog exists
  const catalog = await Catalog.findById(catalogId);
  if (!catalog) {
    throw new AppError('Catalog not found', 404);
  }
 //  Business validation
  if (sellingPrice < costPrice) {
    throw new AppError('Selling price cannot be lower than cost price', 400);
  }

const aiDescription = await generateProductDescription({name,
     category:catalog.name,
      sellingPrice
    });
  const finalDescription = description || aiDescription;
  
    const aiTags = await generateProductTags({
      name,
      category:catalog.name,
      description:finalDescription
    });
  const embeddingText = `
      ${name}
      ${catalog.name}
      ${aiDescription}
      ${aiTags.join(" ")}
    `;

    const embedding = await getEmbedding(embeddingText);
const product = await Product.create({
    storeId: store._id,
    catalogId,
    name: name.trim(),
    description: finalDescription,
    costPrice,
    sellingPrice,
    stock,
    tags: aiTags,
    aiMeta: {
      embedding,
      lastAnalyzedAt: new Date()
    }
  });

  return {
    message: 'Product created successfully',
    product:{
      id:product._id,
      name:product.name,
      description:product.description,
      stock:product.stock,
      sellingPrice:product.sellingPrice
    }
  };
}
//upload product images service
async function uploadImagesService(productId, sellerId, files) {

  if (!files || files.length === 0)
    throw new AppError('No images uploaded', 400);

  const product = await Product.findById(productId);

  if (!product)
    throw new AppError('Product not found', 404);

  if (product.isDeleted)
    throw new AppError('Cannot upload images to deleted product', 400);

  // Ownership check
  const store = await Store.findOne({ ownerId: sellerId });

  if (!store || !product.storeId.equals(store._id))
    throw new AppError('Not authorized', 403);

  // Max 5 total images
  if (product.images.length + files.length > 5)
    throw new AppError('Maximum 5 images allowed per product', 400);

  const newImages = files.map(file => ({
    url: file.path,
    uploadedAt: new Date()
  }));

  product.images.push(...newImages);
  await product.save();
  return{
    message:'Images uploaded successfully',
    product:product 
  };
}

async function updateProductService(productId, sellerId, data) {
  
 if(!productId||!sellerId)throw new AppError('product or seller id is missed',400)
   // 1️⃣ Find seller store
   const store = await Store.findOne({ ownerId: sellerId });

   if (!store)
      throw new AppError('Seller store not found', 404);

   if (store.status !== 'active')
      throw new AppError('Store is suspended', 403);

   // 2️⃣ Find product
   const product = await Product.findById(productId);

   if (!product || product.isDeleted)
      throw new AppError('Product not found', 404);

   if (!product.storeId.equals(store._id))
      throw new AppError('Unauthorized action', 403);

   if (product.isBanned)
      throw new AppError('Product is banned by admin', 403);

   // 3️⃣ Filter allowed fields
   const allowedFields = [
      'name',
      'description',
      'costPrice',
      'sellingPrice',
      'stock',
      'isActive',
      'catalogId'
   ];

   const filteredData = filterObject(data, allowedFields);

   // 4️⃣ Business price validation
   const newCost = filteredData.costPrice ?? product.costPrice;
   const newSelling = filteredData.sellingPrice ?? product.sellingPrice;

   if (newSelling < newCost)
      throw new AppError('Selling price cannot be lower than cost price', 400);

   // 5️⃣ Get catalog (old or new)
   const catalogId = filteredData.catalogId || product.catalogId;

   const catalog = await Catalog.findById(catalogId);
   if (!catalog)
      throw new AppError('Invalid catalog', 404);

   // 6️⃣ Detect changes
   const identityChanged =
      filteredData.name || filteredData.catalogId;

const descriptionSent = 'description' in filteredData;

   const descriptionChanged = descriptionSent;

   // 7️⃣ Apply updates
   Object.assign(product, filteredData);

   // 8️⃣ AI Logic

   // 🔹 Regenerate description only if identity changed
   //     AND seller didn't send description
   if (identityChanged && !descriptionSent) {
      product.description = await generateProductDescription({
         name: product.name,
         category: catalog.name,
         sellingPrice: product.sellingPrice
      });
   }

   // 🔹 Regenerate tags if identity changed
   if (identityChanged) {
      product.tags = await generateProductTags({
         name: product.name,
         category: catalog.name,
         description: product.description
      });
   }

   // 🔹 Regenerate embedding if semantic fields changed
   if (identityChanged || descriptionChanged) {

      const text = `
         ${product.name}
         ${catalog.name}
         ${product.description}
         ${product.tags.join(" ")}
      `;

      const embedding = await getEmbedding(text);

      product.aiMeta.embedding = embedding;
      product.aiMeta.lastAnalyzedAt = new Date();
   }

   await product.save();

   return {
      message: 'Product updated successfully',
      product: {
         id: product._id,
         name: product.name,
         sellingPrice: product.sellingPrice,
         stock: product.stock,
         isActive: product.isActive
      }
   };
}

async function deleteProductService(productId, sellerId) {
  if(!productId||!sellerId)throw new AppError('product or seller id is missed',400)

   //  Find seller store
   const store = await Store.findOne({ ownerId: sellerId });
  if (!store)
      throw new AppError('Seller store not found', 404);
 if (store.status !== 'active')
      throw new AppError('Store is suspended', 403);

   //  Find product
   const product = await Product.findById(productId);

   if (!product || product.isDeleted)
      throw new AppError('Product not found', 404);

   // Ownership validation
   if (!product.storeId.equals(store._id))
      throw new AppError('Unauthorized action', 403);

   // Perform soft delete
   product.isDeleted = true;
   product.deletedAt = new Date();
   product.isActive = false; // Ensure hidden

   await product.save();

   return {
      message: 'Product deleted successfully'
   };
}
//getproducts
async function getSellerProductsService(sellerId, query) {

   const { page, limit, search, isActive } = query;

   // 1️⃣ Find seller store
   const store = await Store.findOne({ ownerId: sellerId });

   if (!store)
      throw new AppError('Seller store not found', 404);

   // 2️⃣ Build filter
   const filter = {
      storeId: store._id,
      isDeleted: false
   };

   if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
   }

   if (search) {
      filter.name = {
         $regex: search,
         $options: 'i'
      };
   }

   const skip = (page - 1) * limit;

   // 3️⃣ Query in parallel
   const [products, totalDocuments] = await Promise.all([
      Product.find(filter)
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit)
         .select('name sellingPrice stock isActive createdAt')
         .lean(),

      Product.countDocuments(filter)
   ]);

   const totalPages = Math.ceil(totalDocuments / limit);

   // 4️⃣ Structured professional response
   return {
      pagination: {
         totalDocuments,
         totalPages,
         currentPage: page,
         pageSize: limit,
         hasNextPage: page < totalPages,
         hasPrevPage: page > 1
      },
      product: products
   };
}

//admin only services
async function banProductService(productId, reason) {

   const product = await Product.findById(productId);

   if (!product)
      throw new AppError('Product not found', 404);

   if (product.isDeleted)
      throw new AppError('Cannot ban deleted product', 400);

   if (product.isBanned)
      throw new AppError('Product already banned', 400);

   product.isBanned = true;
   product.bannedAt = new Date();
   product.banReason = reason || 'Policy violation';

   await product.save();
   return {
     product:product
   }
}

async function unbanProductService(productId) {

   const product = await Product.findById(productId);

   if (!product)
      throw new AppError('Product not found', 404);

   if (!product.isBanned)
      throw new AppError('Product is not banned', 400);

   product.isBanned = false;
   product.bannedAt = undefined;
   product.banReason = undefined;

   await product.save();
   return{
     product:product
     };
}

async function getAllProductsService(query) {
  // 1️⃣ Pagination
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);
  const skip = (page - 1) * limit;

  // 2️⃣ Filters
  const filter = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true';
  }

  if (query.isDeleted !== undefined) {
    filter.isDeleted = query.isDeleted === 'true';
  }

  if (query.isBanned !== undefined) {
    filter.isBanned = query.isBanned === 'true';
  }

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  // 3️⃣ Query database
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name sellingPrice stock isActive isDeleted isBanned createdAt'),

    Product.countDocuments(filter)
  ]);
const totalPages=Math.ceil(total/limit)
  return {
    total,
    page,
    limit,
    totalPages,
    products
  };
}
//public service layer

async function getPublicProductsService(query) {
  // 1️⃣ Pagination
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);
  const skip = (page - 1) * limit;

  // 2️⃣ Base filter: only active & not deleted products
  const filter = {
    isActive: true,
    isDeleted: false,
    isBanned:false
  };

  // 3️⃣ Optional search filters
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' }; // name search
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.sellingPrice = {};
    if (query.minPrice !== undefined) {
      filter.sellingPrice.$gte = parseFloat(query.minPrice);
    }
    if (query.maxPrice !== undefined) {
      filter.sellingPrice.$lte = parseFloat(query.maxPrice);
    }
  }

  // 4️⃣ Query database
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name description sellingPrice stock tags rating numReviews createdAt'), // only public fields
    Product.countDocuments(filter)
  ]);
const totalPages=Math.ceil(total/limit);
  return {
    pagination: {
         total,
         totalPages,
         currentPage: page,
         pageSize: limit,
         hasNextPage: page < totalPages,
         hasPrevPage: page > 1
      },
      product: products
  };
}

module.exports={createProductService,updateProductService,
deleteProductService,
getSellerProductsService,
banProductService,
unbanProductService,
getAllProductsService,
getPublicProductsService,
uploadImagesService
};