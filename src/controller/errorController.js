const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid Input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// This error happen when token is wrong (invalid signature)
const handleJWTChangeTokenError = () => new AppError('Invalid token. Please login again!', 401);

// This error happen when token is expired
const handleJWTExpiredTokenError = () => new AppError('Token is expired. Please login again!', 401);

const sendErrorForDevelopment = (err, res) => {
  // Showing Operational or Programming and Unknown Errors
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorForProduction = (err, res) => {
  // Operational, trusted error: send message to client
  // Operational errors coming from AppError class
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
    // Programming or other unknown error : don't appear the error to the client
  } else {
    // 1) Log error
    console.error('Programming or unknown Error : ', err);
    // 2) Send generic message to postman
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong'
    });
  }
};

/* Define GLOBAL ERROR HANDLING MIDDLEWARE :
By specifying 4 parameters express know Automatically that
this is error handling Middleware
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorForDevelopment(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    /*
      There are 3 types of mongoose errors we want to mark it as
      operational errors :
      1- CastError ->  can't convert objectID
      2- MongoError -> Duplicate Fields
      3- ValidationError
     */
    let error = { ...err };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationDB(error);
    /*
      Tow types of token error :
      1- token changed
      2- token expired
     */
    if (error.name === 'JsonWebTokenError') error = handleJWTChangeTokenError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredTokenError();
    sendErrorForProduction(error, res);
  }
};