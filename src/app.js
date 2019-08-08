const express = require('express');
const fs = require('fs');
const morgan = require('morgan');

const app = express();
const port = 3000;

// 1) MIDDLEWARE
app.use(morgan('dev'));
app.use(express.json());
app.use((req, res, next) => {
  console.log('Hello from middleware');
  next();
});

// Convert json to java script object
const toursList = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`).toString()
);

// 2) ROUTES AND HANDLERS

const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    result: toursList.length,
    data: { tours: toursList }
  });
};
const createTour = (req, res) => {
  const newId = toursList[toursList.length - 1].id + 1;
  // Object.assign => combine two object in one object
  const newTour = Object.assign({ id: newId }, req.body);
  toursList.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
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
const getTour = (req, res) => {
  console.log(req.params);
  // convert string to number
  const id = req.params.id * 1;
  const tour = toursList.find(element => element.id === id);

  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });
};
const updateTour = (req, res) => {
  // fail
  if (req.params.id * 1 > toursList.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }
  // success
  return res.status(200).json({
    status: 'success',
    data: {
      tour: 'put updated tour here ...'
    }
  });
};
const deleteTour = (req, res) => {
  // fail
  if (req.params.id * 1 > toursList.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }
  /*
   success, 204 mean no content 
  * */

  return res.status(204).json({
    status: 'success',
    data: null
  });
};
// app.route('/api/v1/tours/').get(getAllTours).post(createTour);

const getAllUsers = (req, res) => {
  // 500 internal server error
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};
const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};
const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};
const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};
const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};

const tourRouter = express.Router();
const userRouter = express.Router();

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

tourRouter
  .route('/')
  .get(getAllTours)
  .post(createTour);
tourRouter
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

userRouter
  .route('/')
  .get(getAllUsers)
  .post(createUser);
userRouter
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);
// 3) START SERVER
app.listen(port, '127.0.0.1', () => {
  console.log('Server is Running');
});
