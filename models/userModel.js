const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const userSchema=new mongoose.Schema({
  name:{
    type:String,
    required:true,
    minlength:3,
    maxlength:20,
    trim:true
  },
  email:{
    type:String,
    required:true,
    lowercase:true,
    match:/^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password:{
    type:String,
    required:true,
    minlength:6,
    select:false
  },
  passwordChangedAt:Date,
  role:{
    type:String,
    enum:['customer','seller','admin','superAdmin'],
    default:'customer'
  },
  isActive:{
    type:Boolean,
  default:true
  },
  isBanned: {
  type: Boolean,
  default: false
},

isVerified:{
  type:Boolean,
  default:false
},
isDeleted:{
  type:Boolean,
  default:false
},
emailVerifyToken:String,
emailVerifyTokenExpires:Date,
passwordResetToken:String,
passwordResetTokenExpires:Date,
loginFailedAttempts:{
  type:Number,
  default:0
},
lockUntil:{
  type:Date,
  default:null
},
  refreshTokens: [
  {
    token: {
      type: String
    },
    ip:String,
    device:String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
],
  avatar:{
    filename:String,
    path:String,
    mimetype:String,
    size:Number,
    uploadedAt:{
      type:Date,
      default:Date.now
    }
  }
},{
  timestamps:true
}
);
// Hash password and set passwordChangedAt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
 this.password = await bcrypt.hash(this.password, 12);

  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
});

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  // If password was never changed
  if (!this.passwordChangedAt) {
    return false;
  }
 // Convert passwordChangedAt to seconds
  const passwordChangedTime = Math.floor(
    this.passwordChangedAt.getTime() / 1000
  );
// Compare times
  return JWTTimestamp < passwordChangedTime;
};
userSchema.index({ email: 1 }, { unique: true });
const User=mongoose.model('User',userSchema);
module.exports=User;