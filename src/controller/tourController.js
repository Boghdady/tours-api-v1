const fs = require('fs');

// Convert json to java script object
const toursList = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`).toString()
);

// Param Middleware, value = the value of id param
exports.checkID = (req, res, next, value) => {
  console.log(`Tour id is : ${value}`);

  if (value > toursList.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }
  next();
};

// another middleware for createTour Handler
exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price'
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    result: toursList.length,
    data: { tours: toursList }
  });
};
exports.createTour = (req, res) => {
  const newId = toursList[toursList.length - 1].id + 1;
  // Object.assign => combine two object in one object
  const newTour = Object.assign({ id: newId }, req.body);
  toursList.push(newTour);

  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
    JSON.stringify(toursList),
    err => {
      if (err) return res.json({ error: err });
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour
        }
      });
    }
  );
};
exports.getTour = (req, res) => {
  console.log(req.params);
  // convert string to number
  const id = req.params.id * 1;
  const tour = toursList.find(element => element.id === id);

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });
};
exports.updateTour = (req, res) => {
  // success
  return res.status(200).json({
    status: 'success',
    data: {
      tour: 'put updated tour here ...'
    }
  });
};
exports.deleteTour = (req, res) => {
  //success, 204 mean no content
  return res.status(204).json({
    status: 'success',
    data: null
  });
};
