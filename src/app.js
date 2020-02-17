const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandling = require('./controller/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// told express to user pug template engine, we don't need to install pug using npm
app.set('view engine', 'pug');
// Determine folder which our views are located in
app.set('views', path.join(__dirname, 'views'));
//----------------------------------------------------------------------------//
// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));
//----------------------------------------------------------------------------//

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

// Body parser, reading data from body into req.body and parse it, options( limit => body accept data in size 10kb)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parse data that coming from urlencoded form
app.use(cookieParser()); // I want to print the cookie for each request to make sure it's created for each request
// app.use(express.json());

/*
  Data Sanitization : means clean all the data that comes into the application
  from malicious code => code that trying to attack our application
 */
// 1) Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// 2) Data sanitization against XSS (Cross Site Scripting) attacks
app.use(xssClean());

// Prevent parameter pollution
app.use(hpp({
  // whitelist :  fields that i want to duplicate . ex : duration=5&duration=9
  whitelist: [
    'duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price'
  ]
}));


// Test the sequence of middleware (only test middleware you can delete it)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log('Header', req.headers);
  console.log(req.cookies);
  next();
});
//----------------------------------------------------------------------------//

// 2) MIDDLEWARE For Specific routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

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
