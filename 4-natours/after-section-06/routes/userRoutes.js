const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup',authController.signup)
router.post('/login',authController.login)

//forgot password and then reset password
router.post('/forgotPassword',authController.forgotPassword)
router.patch('/resetPassword/:token',authController.resetPassword)

//for updating the password after login
router.patch('/updateMyPassword',authController.protect, authController.updatePassword )

// below is for upating the user detail by the user
router.patch('/updateMe',authController.protect, userController.updateMe )

router.delete('/deleteMe',authController.protect, userController.deleteMe )


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
