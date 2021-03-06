const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// Param middleware
// router.param('id', tourController.checkID);
//-------------------------------------------------------------------------------
/* Nested Route : First Solution (Bad)
Nested Route example ==> we will get the tour id form url and the user id form logged user (token)
  POST /tour/21676276231/reviews -> create reviews in the tour resource
  GET /tour/21676276231/reviews -> access reviews in the tour resource
  GET /tour/21676276231/reviews/7627gf2 -> access a specific review in the tour resource
  #### This called instead route, it make sense when  there are a clear
    parent-child relationship between resource, ex : access reviews
    resource in the tour resource ####
*/
// router.route('/:tourId/reviews')
//   .post(authController.protect, authController.restrictTo('user'), reviewController.createReview);

/* Nested Route : Second Solution (Good)
  MergeParams: Advanced mongoose feature to do Nested routes, we basically say
  that this tour router should use the review router, to access createReview
  handler and other handler in Review Route
 */
router.use('/:tourId/reviews', reviewRouter);

//--------------------------------------------------------------------------------
// alias for top 5 cheapest tours
router.route('/top-5-cheapest')
  .get(tourController.aliasTopCheapestTours, tourController.getAllTours);

// alias for top 5 rating tours
router.route('/top-5-rating')
  .get(tourController.aliasTopRatingTours, tourController.getAllTours);

// aggregation example 1
router.route('/tour-statistics')
  .get(tourController.getTourStatistics);

// aggregation example 2
router.route('/monthly-plan/:year')
  .get(tourController.getMonthlyPlan);


// I'm in ismalia and i want to find all tours within 300 km or mile
/* args =>
  distance : the distance i want to find tours with it.
  center : my current location or the point where we are ex: ismalia or cairo.
  unit : distance unit (km or mile)
 */
// /tours-within/300/center/34.1343974,-118.1314297/unit/mi  => readable way
// /tours-within/?distance=300&center=34.1343974,-118.1314297,17&unite=mi  => another way
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

// aggregation to calculate distances to all tours from a certain point
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);


router.route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);

router.route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);


module.exports = router;
