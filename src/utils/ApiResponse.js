class ApiResponse{
<<<<<<< HEAD
    constructor(
        statusCode,
        data,
        message="Success"
    ){
        this.statusCode=statusCode,
        this.data=data
        this.message=message
        this.success=statusCode <400
    }
}
export {ApiResponse}
=======
  constructor(
    statuscode,
    data,
    message = "success"
  ){
    this.statuscode = statuscode
    this.data = data
    this.message = message
    this.success = statuscode < 400
  }
}

export {ApiResponse}
// about status code 
/*
1) information response (100 - 199)
2) successful response(200-299)
3) redirectional message (300-399)
4) client error response (400-499)
5) server error response (500-599) */
>>>>>>> 76acaaad2a527ca2d9f03b29eece8858576f1346
