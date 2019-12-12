const Tour = require('./../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./../controller/handlerFactory');


// alias 1 : Get top 5 cheapest tours
exports.aliasTopCheapestTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// alias 2 : Get top 5 ratings tours
exports.aliasTopRatingTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};


exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   //************** 1) BUILD THE QUERY *****************//
//   const apiFeatures = new ApiFeatures(Tour.find(), req.query).filter()
//     .sort().limitFields().paginate();
//
//   //************** 2) EXECUTE THE QUERY *****************//
//   const allTours = await apiFeatures.mongooseQuery;
//
//   //************** 3) SEND RESPONSE *****************//
//   res.status(200).json({
//     status: 'success',
//     results: allTours.length,
//     data: { tours: allTours }
//   });
//
//
//   //************** 1) BUILD A QUERY *****************//
//   // // create new object that takes all fields in query string
//   // const queryObj = { ...req.query };
//   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//   // // delete excluded fields from queryObj if exists
//   // excludedFields.forEach(el => delete queryObj[el]);
//   //
//   // console.log(queryObj);
//   // // ======> A) Advanced Filtering using gte,gt,lte,lt
//   // // Convert object to string
//   // let queryStr = JSON.stringify(queryObj);
//   // // replace any (gte,gt,lte,lt) with ($gte,$gt,$lte,$lt)
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//   // console.log(JSON.parse(queryStr));
//   //
//   // // method 1) Filtering using query object (find return query)
//   // let query = Tour.find(JSON.parse(queryStr));
//
//   // method 2) Filtering using mongoose methods
//   // const allTours =  Tour.find({})
//   //   .where('duration').equals(5)
//   //   .where('difficulty').equals('easy');
//
//   // // =========> B) Sorting (ask + ,desc -)
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   console.log(sortBy);
//   //   query = query.sort(sortBy);
//   // } else {
//   //   // default sort
//   //   query = query.sort('-createdAt');
//   // }
//
//   /* ========> C) Fields limiting : allow clients to choose which field
//                   they wants to get back in the response.
//   */
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v');
//   // }
//
//   /* =========> D) Pagination
//       page=2&limit=10 ==> 1-10 = page 1 , 11-20 = page 2 , 21-30 page 30
//    */
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;
//   //
//   // query.skip(skip).limit(limit);
//   //
//   // // validate if user enter page not exist
//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error('This page does not exist');
//   // }
//   // const allTours = await query;
// });
exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync(async (req, res, next) => {
//
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: { tour: newTour }
//   });
// });

// populateOptions: to access virtual populate in the Tour model
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// exports.getTour = catchAsync(async (req, res, next) => {
//
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: { tour: tour }
//   });
// });

exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: { tour }
//   });
// });

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   console.log(tour);
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   //success, 204 mean no content
//   return res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

/*
  Aggregation example
  Aggregation pipeline contains a set of stages
 */
exports.getTourStatistics = catchAsync(async (req, res, next) => {
  const statistics = await Tour.aggregate([
    // Stage 1
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    // Stage 2
    {
      $group: {
        // _id: '$ratingsAverage' ,
        _id: { $toUpper: '$difficulty' },
        // _id: null ,
        numTours: { $sum: 1 }, // counter
        numRatings: { $sum: '$ratingsQuantity' },
        // calc the average of all rating that gte 4.5
        avgRating: { $avg: '$ratingsAverage' },
        // calc the average price
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    // Stage 3
    {
      // 1 mean ask, -1 des
      $sort: { avgPrice: 1 }
    }
    // // Stage 4
    // {
    //   // Excluded or Hide EASY from the result
    //   $match: { _id: { $ne: 'EASY'}}
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: { statistics }
  });
});

/*
    Another aggregation example,
    we need to calculate how many tours in each month
    for the given year
 */
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year;
  const plan = await Tour.aggregate([
    // Stage 1 : unwind
    {
      // unwind -> Deconstructs an array field from the input documents to output a document for each element
      $unwind: '$startDates'
    },
    // Stage 2 : $match
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    // Stage 3 : $group
    {
      $group: {
        // $month -> 	Returns the month for a date as a number between 1 (January) and 12 (December).
        _id: { $month: '$startDates' },
        numOfToursInMonth: { $sum: 1 }, // counter
        nameOfToursInMonth: { $push: '$name' } // push names of tours into array

      }
    },
    // Stage 4 : $addFields
    {
      // add field in the result {name of field = value}
      $addFields: { month: '$_id' }
    },
    // Stage 5 : $project
    {
      $project: {
        // to hide _id field from the output
        _id: 0
      }
    },
    // Stage 6 : $sort
    {
      // 1 mean ask, -1 des
      $sort: {
        numOfToursInMonth: -1
      }
    },
    // Stage 7 : $limit
    {
      // show only 6 documents
      $limit: 12
    }

  ]);

  res.status(200).json({
    status: 'success',
    data: { plan }
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/300/center/34.1343974,-118.1314297/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const {distance, latlng, unit} = req.params;
  const [lat, lng] = latlng.split(','); // split return array
  // convert distance to radiance to be understandable for mongodb geospatial query
  const radius = unit === 'mi' ? distance / 3963.2: distance / 6378.1;

  if(!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng',400));
  }
  // Get all tours that their startLocations points within the required point
  // don't forget to add 2dsphere in the Model
  const tours = await Tour.find({
    startLocation:{ $geoWithin: { $centerSphere:[[lng,lat], radius]}}
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    }
  })
});

// aggregation to calculate distances to all tours from a certain point, and sorted to the nearest
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit} = req.params;
  const [lat, lng] = latlng.split(','); // split return array
  // convert distance from meter to km or mi
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if(!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng',400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [ lng * 1, lat * 1 ] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      }
    },
    {  // Fields that i want to show in the response
      $project: {
        distance: 1,
        name: 1,
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    }
  })
});