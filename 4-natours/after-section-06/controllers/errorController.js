const AppError = require('./../utils/appError')

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const handleDuplicateFieldDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
  const message = `Dupicate field value ${value}. Please use another value`
  return new AppError(message,400)
}

//basically the concept is that we want to show only limited error to client but during the development we want full detail error.
const sendErrorDev = (err, res)=> {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    message: err.message,
    stack: err.stack //stack shows the where the error comes
  });
}

const handleJWTError = err => new AppError('Invalid token, Please log in again!', 401)


const sendErrorProd = (err, res)=> {
  //is operational is the name we have given in appError file, error which comes from ourside
  if (err.isOperational) {                
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

  //Programming or unknown error, here we don't want to leak error to client
  } else {
    // 1) Log error
    console.error('ERROR', err)
    // 2) Send generic messages
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    })
  }
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV == 'development') {
    sendErrorDev(err, res)
  } else if (process.env.NODE_ENV == 'production') {
    let error = { ...err }
    //cast error is invalid keyword path request
    if (error.name === 'CastError') error = handleCastErrorDB(error)
    
    //here handling the duplicate key updation
    if (error.code === 11000) error = handleDuplicateFieldDB(error)

    if(error.name === 'JsonWebTokenError') error = handleJWTError(error)

    sendErrorProd(error, res)
  }
};
