const express = require('express');
const reviewController = require('./../controller/reviewController');
const authController = require('./../controller/authController');


// mergeParams : allow us to access the parameters on other routers
const router = express.Router({ mergeParams: true });

// this route can accept these all requests
// POST /tour/1276dh2sd/reviews ==> Coming from nested rout in touRoute
// GET /tour/1276dh2sd/reviews  ==> Coming from nested rout in touRoute
// Post /reviews
// GET /reviews
router.route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(authController.protect, authController.restrictTo('user'),
    reviewController.setUserIdAndTourId, reviewController.createReview);

router.route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);


module.exports = router;