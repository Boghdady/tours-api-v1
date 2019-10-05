const mongoose = require('mongoose');

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

// Query Middleware
/*
Populate: to get accessed the referenced tour and user whenever we query for
a certain review document.
note:  populate will add new query that mean request will do three queries
one for find review and second for populate tour and three for populate user
*/
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

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

