const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
      type: String,
      required: [true, 'Review can not be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    // Parent references example
    tour: { // foreignField
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, ' Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  // Options
  {
    // to enable showing virtuals fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/*
  Preventing Duplicate Reviews using Indexes.
  this index mean : the combination between Tour and Review must be unique
 */
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query Middleware
/*
Populate: to get accessed the referenced tour and user whenever we query for
a certain review document.
note:  populate will add new query that mean request will do three queries
one for find review and second for populate tour and three for populate user
*/
// Using when i user Child Referencing
reviewSchema.pre(/^find/, function(next) {
  // Populate user and tour in Review
  // this.populate({
  //   path: 'tour',
  //   select: 'name' // show only tour name
  // }).populate({
  //   path: 'user',
  //   select: 'name photo' // show only user name and his photo
  // });
  // We need to populate only user in Review
  this.populate({
    path: 'user',
    select: 'name photo' // show only user name and his photo
  });
  next();
});


/* statics methods : we can only call it on the model
  Create middleware method to calculate the number of rating and average
  rating for each tour based on tourID in the Review Model
 */
reviewSchema.statics.calcAverageRatingsAndQuantity = async function(tourId) {
  const statics = await this.aggregate([
    // Stage 1
    {
      $match: { tour: tourId }
    },
    // Stage 2
    {
      $group: {
        _id: '$tour', // Grouped result by tour
        nRating: { $sum: 1 }, // Counter
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(statics);
  // Updating Tour document (ratingsAverage,ratingsQuantity ) by new values that comes from aggregation
  if (statics) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: statics[0].nRating,
      ratingsAverage: statics[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

/*
  Doc middleware to call calcAverageRatings method when creating or updating
  new review document
 */
reviewSchema.post('save', function() {
// this points to current review document
// this.constructor points to Review model , i use it because maybe Review model not created until now in db if we use pre middleware
//   Review.calcAverageRatings(this.tour);
  this.constructor.calcAverageRatingsAndQuantity(this.tour);
});

/*
  Query middleware to call calcAverageRatings method when updating or deleting using this :
  - findByIdaAndUpdate()
  - findByIdAndDelete()
  we can access this methods only on query middleware
 */
reviewSchema.pre(/^findOneAnd/, async function(next) {
  /* this,findOne() => will get the current Query from db because this key word points to the
  current query not the current document and we need the current document to access the tourId
  - this.findOne() => points to the current query in the db,note :  can't access it in post query middleware
  because the query  will be already executed
  - this.r => create new review collection contain the current query
   */
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  // we can not access this.findOne() because the query already executed so we use it in pre query middleware
  await this.r.constructor.calcAverageRatingsAndQuantity(this.r.tour);

});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

