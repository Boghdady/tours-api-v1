const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const ApiFeatures = require('./../utils/apiFeatures');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');

// These function return function (Closure concept in js)
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

exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { data: doc }
  });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
  // create : if there are data in the body not exist in the Schema will ignore it
  const newDoc = await Model.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { data: newDoc }
  });
});

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
  // const doc = await Model.findById(req.params.id).populate('reviews');
  let query = Model.findById(req.params.id);
  if (populateOptions) query = query.populate(populateOptions);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  if (Model === Tour) {
    // Convert image name to url
    if (doc.imageCover) {
      doc.imageCover = `http://127.0.0.1:3000/img/tours/${doc.imageCover}`;
    }
    if (doc.images) {
      let tourImagesUrls = [];
      doc.images.map((imgName, index) => {
        const url = `http://127.0.0.1:3000/img/tours/${imgName}`;
        tourImagesUrls.push(url);
      });
      doc.images = tourImagesUrls;
    }

  }
  if (Model === User) {
    if (doc.photo) {
      doc.photo = `http://127.0.0.1:3000/img/users/${doc.photo}`;
    }
  }

  res.status(200).json({
    status: 'success',
    data: { data: doc }
  });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {

  // To allow nested routes like get all reviews on a Tour
  let filter = req.filterObject || {};

  //************** 1) BUILD THE QUERY *****************//
  const apiFeatures = new ApiFeatures(Model.find(filter), req.query).filter()
    .sort().limitFields().paginate();

  //************** 2) EXECUTE THE QUERY *****************//
  // const allDocs = await apiFeatures.mongooseQuery.explain();
  const allDocs = await apiFeatures.mongooseQuery;

  //************** 3) SEND RESPONSE *****************//
  res.status(200).json({
    status: 'success',
    results: allDocs.length,
    data: { data: allDocs }
  });

});
