const config={
  PORT:process.env.PORT||3000,
  REFRESH_SECRET:process.env.REFRESH_SECRET,
  ACCESS_SECRET:process.env.ACCESS_SECRET,
  MONGO_URL:process.env.MONGO_URL
}
if(!config.MONGO_URL){throw new 
  Error('mongo url is missing!')
}
module.exports=config;