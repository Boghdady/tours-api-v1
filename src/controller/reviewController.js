const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controller/handlerFactory');

// Middleware to create filter object and send it to getAll handler before getting all reviews on a Tour
exports.createFilterObjectForNestedRoute = (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  req.filterObject = filter;
  next();
};

exports.getAllReviews = factory.getAll(Review);

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//
//   const allReviews = await Review.find(filter);
//
//   res.status(200).json({
//     status: 'success',
//     results: allReviews.length,
//     data: { reviews: allReviews }
//   });
// });

exports.getReview = factory.getOne(Review);

// Middleware to setUserIdAndTourId before creating Review
exports.setUserIdAndTourId = (req, res, next) => {
  // Allow nested routes, user can specify manually userId and tourId
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);
// exports.createReview = catchAsync(async (req, res, next) => {
//   const newReview = await Review.create(req.body);
//
//   res.status(201).json({
//     status: 'success',
//     data: { review: newReview }
//   });
// });
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);