const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController')
const reviewRouter = require('./../routes/reviewRoutes')
const router = express.Router();

// router.param('id', tourController.checkID);



// router
// .route('/:tourId/reviews')
// .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
// )
//* when using the above the problem arises that there is confusion ki reviews ko tour me kyu likh rahe h so we use the below method
//* for the below, first go to the app.use('/api/v1/tours', tourRouter); in app file and then go to the below one route path
router.use('/:tourId/reviews', reviewRouter)


//!alis
//basically if we have certain condition like top 5 best and cheap price data. then we can use the query like ?limit=5&sort=-ratingAverage,pice
//but we have the other option like we can create the dedicated route for this type of request
router
.route('/top-5-cheap')
.get(tourController.aliasTopTours, tourController.getAllTours)

//this is the aggression
router
.route('/monthly-plan/:year')
.get(authController.protect, authController.restrictTo('admin', "lead-guide", "guide"), tourController.getMonthlyPlan)




// /tours-within?distance=233&center=-40,45&unit=mi //* old method for url
// /tours-within/233/center/-40,45/unit/mi   //* new method of url
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);


// This route is for getting the distance
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);




router
.route('/tour-stats')
.get(tourController.getTourStats)


router
.route('/')
//"authController.protect" protects the route ie only authenticated in person can access this route. This function is the middleware
.get(tourController.getAllTours)
//here we have chained two middleware
.post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);

router
.route('/:id')
.get(tourController.getTour)
.patch(authController.protect, authController.restrictTo('admin', "lead-guide"), tourController.updateTour)
//authoriszation is the process of giving certain activity rights to only limited person, not all logged in person
//authController.updateTour is the authorization
// here we passing the admin, lead-guide means admin has the rights to delete the data
.delete(authController.protect, authController.restrictTo('admin', "lead-guide"), tourController.deleteTour);

  
module.exports = router;
