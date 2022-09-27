const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController')
const router = express.Router();

// router.param('id', tourController.checkID);


//!alis
//basically if we have certain condition like top 5 best and cheap price data. then we can use the query like ?limit=5&sort=-ratingAverage,pice
//but we have the other option like we can create the dedicated route for this type of request
router
.route('/top-5-cheap')
.get(tourController.aliasTopTours, tourController.getAllTours)

//this is the aggression
router
.route('/monthly-plan/:year')
.get(tourController.getMonthlyPlan)


router
.route('/tour-stats')
.get(tourController.getTourStats)


router
.route('/')
//"authController.protect" protects the route ie only authenticated in person can access this route. This function is the middleware
.get(authController.protect, tourController.getAllTours)
//here we have chained two middleware
.post(tourController.createTour);

router
.route('/:id')
.get(tourController.getTour)
.patch(tourController.updateTour)
//authoriszation is the process of giving certain activity rights to only limited person, not all logged in person
//authController.updateTour is the authorization
// here we passing the admin, lead-guide means admin has the rights to delete the data
.delete(authController.protect, 
    authController.restrictTo('admin', "lead-guide"), 
    tourController.deleteTour);


module.exports = router;
