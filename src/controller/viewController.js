const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync( async(req, res) => {
  /// 1) Get tours data from collection
  /// 2) Build overview template
  /// 3) Render that template using the tours data
  const tours = await Tour.find({});
  res.status(200).render('overview', {
    title:'All Tours',
    tours
  });
});
exports.getTour = catchAsync( async(req, res) => {
  /// 1) Get data, for the requested tour (including reviews and guides)
  /// 2) Build template
  /// 3) Render template from the data that coming from step 1
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    fields:'review rating user'
  });

  res.status(200).render('tour', {
    title:`${tour.name} tour`,
    tour
  });
});

exports.getLoginForm = catchAsync( async(req, res, next) => {
// const tour = await Tour.findById(req.params.id);
  res.status(200).render('login', {
    title: 'Log into your account'
  });

});