const mongoose=require('mongoose');
const logger=require('../utils/logger');
const config=require('./env');
async function connectdb(){
  try{
    await mongoose.connect(config.MONGO_URL);
    logger.info('mongodb connected.');
  }
  catch(err){
    logger.error(err);
    throw(err);
  }
}
module.exports=connectdb;