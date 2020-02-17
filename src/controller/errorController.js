const AppError = require('../utils/appError');

/* Define GLOBAL ERROR HANDLING MIDDLEWARE :
By specifying 4 parameters express know Automatically that
this is error handling Middleware
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorForDevelopment(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    /*
      There are 3 types of mongoose errors we want to mark it as
      operational errors :
      1- CastError ->  can't convert objectID
      2- MongoError -> Duplicate Fields
      3- ValidationError
     */
    let error = { ...err }; // copy the err that coming global middleware into error
    error.message = err.message; // because message not copied to error from err
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
    sendErrorForProduction(error, req, res);
  }
};


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

const sendErrorForDevelopment = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // Showing Operational or Programming and Unknown Errors
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // B) RENDERED WEBSITE : render error using pug template engine
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  });
};

const sendErrorForProduction = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    // Operational errors coming from AppError class
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programming or other unknown error : don't appear the error to the client
    // 1) Log error
    console.error('Programming or unknown Error : ', err);
    // 2) Send generic message to postman
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong'
    });
  }
  // B) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // Programming or other unknown error : don't appear the error to the client
  // 1) Log error
  console.error('Programming or unknown Error : ', err);
  // 2) Send generic message to postman
  return res.status(500).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

