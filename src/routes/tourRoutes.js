const express = require('express');
const tourController = require('../controller/tourController');

const router = express.Router();

// Param middleware
// router.param('id', tourController.checkID);

// alias for top 5 cheapest tours
router.route('/top-5-cheapest')
  .get(tourController.aliasTopCheapestTours, tourController.getAllTours);

// alias for top 5 rating tours
router.route('/top-5-rating')
  .get(tourController.aliasTopRatingTours, tourController.getAllTours);

router.route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router.route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
