const express = require('express');
const fs = require('fs');

const app = express();
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

app.listen(port, '127.0.0.1', () => {
  console.log('Server is Running');
});
