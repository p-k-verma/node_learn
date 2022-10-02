const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

const router = express.Router();

router.post('/signup',authController.signup)
router.post('/login',authController.login)

//forgot password and then reset password
router.post('/forgotPassword',authController.forgotPassword)
router.patch('/resetPassword/:token',authController.resetPassword)

//* router is like mini app and we know middleware run in a seaquence, so here we added the middleware so all the routes below one all have the default prevent middleware
router.use(authController.protect)

//for updating the password after login
router.patch('/updateMyPassword', authController.updatePassword )

// it gives the login user detail from the factory function
router.get('/me', userController.getMe, userController.getUser)

// below is for upating the user detail by the user
router.patch('/updateMe', userController.updateMe )

router.delete('/deleteMe', userController.deleteMe )


// below is the middleware which applied to the all the routes below, and all routes are protected by above protect and restricted to the admin
router.use(authController.restrictTo('admin'))

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
