const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./../models/userModel');

const tourSchema = new mongoose.Schema(
  // Definition
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A tour must have a name'],
      trim: true,
      maxlength: [40, 'A tour must have less or equal than 40 characters'],
      minlength: [10, 'A tour must have more or equal than 10 characters']
      // Do validation using external package (validator pkg)
      // validate: [validator.isLowercase, 'Tour name must be lowercase']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maxGroupSize']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour should have a difficulty'],
      enum: {
        // built in validator
        values: ['easy', 'medium', 'difficult'],
        message: 'You should choose: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.0,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be less or equal 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      // validate if discountPrice value < price
      // Do validation using mongoose itself
      validate: {
        validator: function(val) {
          // note : this -> points to new document, so this validator will work only on creation and save
          return val < this.price;   // 100 < 200 = true, 250 < 200 =  false
        }, // {VALUE} mean the value for priceDiscount , thanks for mongoose
        message: 'Discount Price {VALUE} should be less than price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // excluded or hide createdAt from response
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    /* Mongodb support Geospatial Data.
    Geospatial Data is basically data that describes places on earth using
    longitude and latitude coordinates , we can describe simple point or
    more complex geometries like lines or polygons or multi types of polygons
     */
    startLocation: {
      // GeoJSON : Specify Geospatial Data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'] // we can add some possible options like polygons
      },
      coordinates: [Number], // Will contains lat and long for the point
      address: String,
      description: String
    },
    // Embedding / De-normalized locations in Tour document
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number], // Will contains lat and long
        address: String,
        description: String,
        day: Number  // the day of the tour in which people will go to this location
      }
    ],
    // Embedding tour guides in Tour: bad solution
    // guides: Array
    // ------------
    // Referencing Tour guides into Tour document (Child Referencing)
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  // Options
  {
    // to enable showing virtuals fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


/*
  Virtual properties did not save in the database, it only show
  in the response.
  ex : calculate the duration in weeks
 */
tourSchema.virtual('durationInWeeks').get(function() {
  return this.duration / 7;
});

/*
  Mongoose Middleware, there are 4 type :
    1- document middleware
    2- query middleware
    3- aggregate middleware
    4- model middleware
    docs url : https://mongoosejs.com/docs/middleware.html
 */

/* 1) Document Middleware (save , validate , remove) , this refers to the document
   pre : will run before an actual event { .save() and .create() }
  note 1 : this 'save' middleware not work before .insertMany() event or
   any other functions, only working with { .save() and .create() } functions.
  note 2 : we can apply multiple pre and post middleware function
 */
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Query Middleware run
/*
Populate: to get accessed the referenced tour guides whenever we query for
a certain tour.
*/
tourSchema.pre(/^find/, function(next) {
  // this point to the current query
  this.populate({
    path: 'guides',
    select: '-__v' // hide some fields
  });
  next();
});

/* // Embedding users guides into Tour : bad solution
 This method responsible about get user using their ids and
 add  them to this.guides array.
 */
// tourSchema.pre('save', async function(next) {
//   // map => returns array of users
//   const tourGuidesPromises = this.guides.map(async id => await User.findById(id));
//   // Add Users array at guides array, we use Promise.all because we waiting a promises of (tourGuidesPromises array)
//   this.guides = await Promise.all(tourGuidesPromises);
//   next();
// });


/*
  post -> executed after all the pre middleware functions have completed.
  run after document save in database, so i have a document as a param.
  ex: send notification after creating document
 */
tourSchema.post('save', function(document, next) {
  // console.log(document);
  console.log('Document type :Post-Save middleware');
  next();
});

/* 2) Query Middleware (find ,findOne, deleteMany, ..), this refers to the query
   allow us to run functions before and after the certain
   query is executed
   note : (/^find/) this regular expression to run this middleware in
   any query start with find word
 */
tourSchema.pre(/^find/, function(next) {
// tourSchema.pre('find', function(next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// post find middleware will gonna run after the query has already executed
tourSchema.post(/^find/, function(queryResult, next) {
  // console.log(queryResult);
  next();
});


/*  2) Aggregation Middleware :
  allows us to add hocks before and after
  an aggregation happens
 */
tourSchema.pre('aggregate', function(next) {
  // unshift  add item on the first of array, shift in the last
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
