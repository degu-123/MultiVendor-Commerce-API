class AppError extends Error{
  constructor(message,statusCode){
    super(Array.isArray(message) ? 'Validation failed' : message);
if (Array.isArray(message)) {
  this.errors = message;
}
    this.statusCode=statusCode;
    this.status=statusCode >=400 && statusCode <500?'fail':'error';
    this.isOperational=true;
    this.name=this.constructor.name;
    Error.captureStackTrace(this,this.constructor);
  }
}
module.exports=AppError;
