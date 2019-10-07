const express = require('express');
const reviewController = require('./../controller/reviewController');
const authController = require('./../controller/authController');


// mergeParams : allow us to access the parameters on other routers
const router = express.Router({ mergeParams: true });

// That mean => protect all the routes that coming after this middleware
router.use(authController.protect);

// this route can accept these all requests
// POST /tour/1276dh2sd/reviews ==> Coming from nested rout in touRoute
// GET /tour/1276dh2sd/reviews  ==> Coming from nested rout in touRoute
// Post /reviews
// GET /reviews
router.route('/')
  .get(reviewController.createFilterObjectForNestedRoute, reviewController.getAllReviews)
  .post(authController.restrictTo('user'),
    reviewController.setUserIdAndTourId, reviewController.createReview);

router.route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);


module.exports = router;