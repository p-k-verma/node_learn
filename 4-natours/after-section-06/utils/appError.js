//here we are making the class of gloal handling function, if any section, error comes we throw error in this class
class AppError extends Error {
    constructor(message, statusCode){
        super(message)
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'  //startswith work only for string
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError