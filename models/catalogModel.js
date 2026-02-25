const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  trim: true
},
description: String, 
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Catalog',//optional if add future 
    default: null
  },
//admin control status
  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

// Indexes for fast search and hierarchy
catalogSchema.index({ name: 'text', description: 'text' }); // search by name/description
catalogSchema.index({ parentId: 1 }); // find subcategories quickly

const Catalog = mongoose.model('Catalog', catalogSchema);
module.exports=Catalog;