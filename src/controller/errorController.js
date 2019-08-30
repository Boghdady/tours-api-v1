/* Define Global Error Handling :
By specifying 4 parameters express know Automatically that
this is error handling Middleware
 */
module.exports = (err, req, res, next) => {
  err.satausCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
};