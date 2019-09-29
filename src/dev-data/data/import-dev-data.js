const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const path = require('path');


// Read the variables from config file and save them into node.js environment variables
// const currentPath = process.cwd();
const DBPath = '/Users/index/Documents/Work/My Coding/Node/tours-api-v1/config.env';

dotenv.config({ path: DBPath });


const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);


// Connect to hosted database, to connect with local replace DB with (process.env.DATABASE_LOCAL)
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(conn => {
    //console.log(conn.connections);
    console.log('DB connected successfully');
  });

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));


// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
  } catch (err) {
    console.log(err);
  }
};

// deleteData().then(res => console.log('deleted successfully'));
// console.log(process.argv);

importData().then(res => console.log('Data successfully loaded'));