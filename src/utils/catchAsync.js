/*
 this method to catch errors in Async functions,
 the Async method is promise and return err if rejected, we catch this error
 */
module.exports = fn => {
  return (req, res, next) => {
    // fn(req, res, next).catch(err => next(err)); //the same
    fn(req, res, next).catch(next);
  };
};
