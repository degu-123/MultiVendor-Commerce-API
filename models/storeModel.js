const mongoose=require('mongoose');
const storeSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // 1 store per user
  },

  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerApplication',
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true,
    unique: true
  },

  description: String,

  isActive: {
    type: Boolean,
    default: true // seller controls: open/close store
  },
 status: {
  type: String,
  enum: ['active', 'suspended'],
  default: 'active'
},
violationCount: {
  type: Number,
  default: 0
},
suspension: {
  reason: String,
  suspendedAt: Date,
  suspendedUntil:Date,
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isAuto: {
    type: Boolean,
    default: false
  }
},

  tags: [String] // optional, for future search or categories

}, { timestamps: true });

// 🔹 Indexes for optimization
storeSchema.index({ name: 'text', description: 'text' });  // text search
storeSchema.index({ isBanned: 1 })  
storeSchema.index({ tags: 1 });   

module.exports = mongoose.model('Store', storeSchema);