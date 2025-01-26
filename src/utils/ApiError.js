class ApiError extends Error{
<<<<<<< HEAD
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null,
        this.message=message
        this.success=false;
        this.errors=errors

        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
=======
  constructor(
  statuscode,
  message = "something went wrong",
  errors =[],
  // stack = ""
){
  super(message)
  this.statuscode = statuscode
  this.data = null
  this.message = message 
  this.success = false
  this.errors = errors
}}

>>>>>>> 76acaaad2a527ca2d9f03b29eece8858576f1346
export {ApiError}