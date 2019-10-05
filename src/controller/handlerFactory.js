const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// These delete function return catchAsync function (Closure concept in js)
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  //success, 204 mean no content
  return res.status(204).json({
    status: 'success',
    data: null
  });
});
