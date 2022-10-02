const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

//* if we don't use the mergeparams then it will specifically use the '/' path but if we use the mergeparams then it will work for '/otherdata' and take otherdata as params
const router = express.Router({ mergeParams: true });

// it is the middleware belwo which all the routes are protected
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'), // we restrict the user having the role as 'user'
    reviewController.setTourUserIds,
    reviewController.createReview
  );


// delete the review route
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
