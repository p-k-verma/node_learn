const express = require('express');
const tourController = require('./../controllers/tourController');

const router = express.Router();


//here we are placing the middleware on param with certain id
//here it is added in the tour so it will work only for tour not for user
router.param('id', tourController.checkID);

router
  .route('/')
  .get(tourController.getAllTours)
  //here we have chained two middleware
  .post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
