const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  // Definition
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A tour must have a name'],
      trim: true
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
      required: [true, 'A tour should have a difficulty']
    },
    ratingsAverage: {
      type: Number,
      default: 1.0
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: Number,
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
    startDates: [Date]
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
 */

/* 1) Document Middleware (pre - post)
   pre : will run before an actual event { .save() and .create() }
  note 1 : this 'save' middleware not work before .insertMany() event or any other functions.
  note 2 : we can apply multiple pre and post middleware function
 */
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('save', function(next) {
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


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
