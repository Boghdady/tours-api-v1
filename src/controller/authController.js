const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.signup = catchAsync(async (req, res, next) => {
  // These fields are needed for signin
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  // Create token for the new user
  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.status(201).json({
    status: 'success',
    token: token,
    data: {
      user: newUser
    }
  });
});
exports.login = (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check of email and password exist in the body
  if (!email || !password) {
    return next(new AppError('Email and password are required'));
  }
  // 2) Check if user exist && password correct
  // If everything ok, send token to client
  const token = 'uweuy8';
  res.status(200).json({
    status: 'success',
    token
  });
};
