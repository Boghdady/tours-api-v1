const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  // Definition
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A tour must have a name'],
      trim: true,
      maxlength: [40, 'A tour must have less or equal than 40 characters'],
      minlength: [10, 'A tour must have more or equal than 10 characters'],
      // Do validation using external package (validator pkg)
      validate: [validator.isLowercase, 'Tour name must be lowercase']
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
          // note : this -> points to new document, so this validator will work only on creation
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
      select: false // excluded or hide createdAt from output
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  // Options
  { // to enable showing virtuals fields
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

tourSchema.pre('save', function(next) {
  // console.log(`Document before send as a response : ${this}`);
  console.log('Document type :Pre-Save middleware');
  next();
});

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
