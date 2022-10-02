const User = require('./../models/userModel')
const AppError = require('./../utils/appError')
const catchAsync = require('./../utils/catchAsync')

const factory = require('./handlerFactory')

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

exports.getMe = (req, res, next)=> {
  req.params.id = req.user.id;
  next();
}


exports.updateMe = catchAsync( async (req, res, next)=> {
  // we have created separate route for the update and change the password

  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. please use /updateMyPassword',400))
  }

  // 2) Filtered out unwanted fields name that are not allowed to be updated
  // filteredBody is what we want to update
  const filteredBody = filterObj(req.body, 'name', 'email')

  // 3) Update user document
  // keep in mind that findByIdAndUpdate is used to updating non-sensitive data, sensitive data are password
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {   // req.user.id is the old,  filteredBody is the new, the boject is to set properties
    new: true,
    runValidators: true
  })

  res.status(200).json({
    status: "success",
    data: {
      user: updateUser
    }
  })
})

//basically we don't delete the account we just made inactive and tell them so called that the account has been delted
exports.deleteMe = catchAsync( async (req, res, next)=> {
  await User.findByIdAndUpdate(req.user.id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null
  })
})


exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};



exports.deleteUser = factory.deleteOne(User)
//* earlier below was used to delete but we created the universal delete function or factory handler which handle the deletion

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!'
//   });
// };


//! do not update the password using below
exports.updateUser = factory.updateOne(User)
// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!'
//   });
// };

exports.getUser = factory.getOne(User)
// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!'
//   });
// };

exports.getAllUsers = factory.getAll(User)
// exports.getAllUsers = catchAsync( async (req, res, next) => {
//   const users = await User.find();

//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: users.length,
//       data: {
//         users
//       }
//     });
// });