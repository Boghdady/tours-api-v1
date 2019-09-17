const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');

const router = express.Router();

// Param middleware
// router.param('id', tourController.checkID);

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

router.route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router.route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router;
