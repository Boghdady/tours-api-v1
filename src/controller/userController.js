const User = require('./../models/userModel');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/*
 filterObj => method take an object and array of allowedFields to return object with
 properties that i need to update
 */
const filterObj = (obj, ...allowedFields) => {
  let newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {

  const users = await User.find({});

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};

// Update current user data
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user send password in the body
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for update password. You should not send password in the body', 400));
  }

  // 2) Filtered out unwanted fields names that are not allowed to updated
  // filterObj => method take an object and return object with properties that i need to update
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  // 4) Send updated user to the client
  res.status(200).json({
    status: 'Success',
    data: {
      user: updatedUser
    }
  });
  // note: we did not use User.save() because it will work the validation and will say password is required
  // await user.save({ validateBeforeSave: true });
});
// Delete account actually make account inactive
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  // 204 code mean deleted
  res.status(204).json({
    status: 'Success',
    data: null
  });
});
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};


exports.deleteUser = (req, res) => {
  //
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};

