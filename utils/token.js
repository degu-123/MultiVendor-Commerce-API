const bcrypt=require('bcryptjs');
const crypto=require('crypto');
const jwt=require('jsonwebtoken');
const config=require('../config/env');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
async function compareToken(token,hashedToken){
  return await bcrypt.compare(token,hashedToken);
}
function generateAccessToken(userId,role){
  return jwt.sign({id:userId,role},config.ACCESS_SECRET,{expiresIn:'1h'});
}
function generateRefreshToken(userId){
  return jwt.sign({id:userId,jti: crypto.randomUUID()},config.REFRESH_SECRET,{expiresIn:'7d'});
}
const verifyAccessToken=(accessToken)=>{
  const decoded=jwt.verify(accessToken,config.ACCESS_SECRET);
  return decoded
}
const verifyRefreshToken=(refreshToken)=>{
  const decoded=jwt.verify(refreshToken,config.REFRESH_SECRET);
  return decoded;
}
async function comparePassword(password,savedPassword){
  return await bcrypt.compare(password,savedPassword);
}
module.exports={generateAccessToken,generateRefreshToken,verifyAccessToken,
verifyRefreshToken,
comparePassword,
compareToken,
hashToken
}