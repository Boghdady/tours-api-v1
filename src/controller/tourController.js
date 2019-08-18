const Tour = require('./../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    console.log(req.query);
    //************** 1) BUILD A QUERY *****************//
    // create new object that takes all fields in query string
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // delete excluded fields from queryObj if exists
    excludedFields.forEach(el => delete queryObj[el]);

    console.log(queryObj);
    // ======> Advanced Filtering using gte,gt,lte,lt
    // Convert object to string
    let queryStr = JSON.stringify(queryObj);
    // replace any (gte,gt,lte,lt) with ($gte,$gt,$lte,$lt)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    console.log(JSON.parse(queryStr));

    // method 1) Filtering using query object (find return query)
    const query = Tour.find(JSON.parse(queryStr));

    // method 2) Filtering using mongoose methods
    // const allTours =  Tour.find({})
    //   .where('duration').equals(5)
    //   .where('difficulty').equals('easy');


    //************** 2) EXECUTE THE QUERY *****************//
    const allTours = await query;

    //************** 3) SEND RESPONSE *****************//
    res.status(200).json({
      status: 'success',
      results: allTours.length,
      data: { tours: allTours }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};
exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { tour: newTour }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { tour: tour }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};
exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({
      status: 'success',
      data: { tour }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};
exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    //success, 204 mean no content
    return res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};
