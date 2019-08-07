const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

const port = 3000;

// Convert json to java script object
const toursList = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`).toString()
);

// select all
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    result: toursList.length,
    data: { tours: toursList }
  });
});

// create
app.post('/api/v1/tours', (req, res) => {
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
});

// select by id
app.get('/api/v1/tours/:id', (req, res) => {
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
});

app.listen(port, '127.0.0.1', () => {
  console.log('Server is Running');
});
