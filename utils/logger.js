const fs=require('fs');
const path=require('path');

const colors={
  reset:'\x1b[0m',
  red:'\x1b[31m',
  green:'\x1b[32m',
  yellow:'\x1b[33m',
  cyan:'\x1b[36m'
}

const log=(level,message)=>{
const time=new Date().toISOString();
let color;
switch(level){
  case 'info':color=colors.green;
  break;
  case 'warn':color=colors.yellow;
  break;
  case 'error':color=colors.red;
  break;
  default:color=colors.cyan
}
const logMessage=message instanceof Error ? `[${time}] [${level.toUpperCase()}] ${message.message}\n${message.stack}` : `[${time}] [${level.toUpperCase()}] ${message}`;
console.log(`${color} ${logMessage}${colors.reset}`)
if(level !=='info'){
  const logFile=path.join(process.cwd(),'logs','error.log')
fs.appendFile(logFile,logMessage +'\n',(err,data)=>{
  if(err){
    console.error('data is not added to file',err);
  }
})
}
}

const logger={
  info:(msg)=>log('info',msg),
  warn:(msg)=>log('warn',msg),
  error:(msg)=>log('error',msg)
};
module.exports=logger;
