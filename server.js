require('dotenv').config();
const app=require('./app');
const connectdb=require('./config/db');
const config=require('./config/env');
const logger=require('./utils/logger');

process.on('uncaughtException', (err) => {
  logger.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(err);
  process.exit(1);
});
async function startServer(){
  try{
await connectdb();
app.listen(config.PORT,()=>{
  logger.info(`Server running in port ${config.PORT}`);
})
}
catch(err){
  logger.error(err);
  process.exit(1);
}
}
startServer();