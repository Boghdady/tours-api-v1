const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');

const AppError = require('./utils/appError');
const globalErrorHandling = require('./controller/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARE WORKING IN ALL

// helmet :  set important security http headers
app.use(helmet());

// Development Logging
console.log(`NODE_ENV IS : ${process.env.NODE_ENV}`);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
/*
  Rate Limiter : it count the number of requests coming from one IP and when
  there are too many request it block the request
 */
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 100 request per one hour
  message: 'Too many requests from this ip, please try again in an hour!'
});
app.use('/api', limiter); // This limiter will affect in routes that start with api

// Body parser, reading data from body into req.body, options( limit => body accept data in size 10kb)
// app.use(express.json({ limit: '10kb' }));
app.use(express.json());

/*
  Data Sanitization : means clean all the data that comes into the application
  from malicious code => code that trying to attack our application
 */
// 1) Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// 2) Data sanitization against XSS (Cross Site Scripting) attacks
app.use(xssClean());
// Serving static files
app.use(express.static(`${__dirname}/public`));

// Test the sequence of middleware (only test middleware you can delete it)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log('Header', req.headers);
  next();
});

// 2) MIDDLEWARE For Specific routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Handle undefined routs
app.all('*', (req, res, next) => {
  // 1) simple way
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cant't find ${req.originalUrl} on this server`
  // });
  // 2) intermediate way
  // const err = new Error(`Cant't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 500;
  /*
  when passing param to next() express know there is error and
   will go to The Global Error Handling Directly
   */
  // Creating error for test
  next(new AppError(`Cant't find ${req.originalUrl} on this server`, 404));
});

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandling);
module.exports = app;
