const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARE Working in all
console.log(`NODE_ENV IS : ${process.env.NODE_ENV}`);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// convert request body to json
app.use(express.json());
// serve static file
app.use(express.static(`${__dirname}/public`));

// 2) MIDDLEWARE For Specific routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Handle undefined routs
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Cant't find ${req.originalUrl} on this server`
  });
  next();
});

module.exports = app;
