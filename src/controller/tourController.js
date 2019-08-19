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
    // ======> A) Advanced Filtering using gte,gt,lte,lt
    // Convert object to string
    let queryStr = JSON.stringify(queryObj);
    // replace any (gte,gt,lte,lt) with ($gte,$gt,$lte,$lt)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    console.log(JSON.parse(queryStr));

    // method 1) Filtering using query object (find return query)
    let query = Tour.find(JSON.parse(queryStr));

    // method 2) Filtering using mongoose methods
    // const allTours =  Tour.find({})
    //   .where('duration').equals(5)
    //   .where('difficulty').equals('easy');

    // =========> B) Sorting (ask + ,desc -)
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      console.log(sortBy);
      query = query.sort(sortBy);
    } else {
      // default sort
      query = query.sort('-createdAt');
    }

    /* ========> C) Fields limiting : allow clients to choose which field
                    they wants to get back in the response.
    */
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    /* =========> D) Pagination
        page=2&limit=10 ==> 1-10 = page 1 , 11-20 = page 2 , 21-30 page 30
     */
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query.skip(skip).limit(limit);

    // validate if page exist or not
    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error('This page does not exist');
    }

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
