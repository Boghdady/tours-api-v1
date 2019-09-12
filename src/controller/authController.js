const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const createToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // These fields are needed for signin
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  // Create token for the new user
  const token = createToken(newUser._id);

  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // });

  res.status(201).json({
    status: 'success',
    token: token,
    data: {
      user: newUser
    }
  });
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check of email and password exist in the body
  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }
  // 2) Check if user exist && password correct
  // .select('+password') ==> to append the password in the result to check if correct with body password, because we hide the field in userSchema
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkCorrectPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // If everything ok, send token to client
  const token = createToken(user._id);
  res.status(200).json({
    status: 'success',
    token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Getting token and check if it exist
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('You are not register, please signup to get access', 401));
  }

  // 2) Validate the token if verify
  /* util.promisify :
     convert traditional callback methods into promises,
     link : http://tiny.cc/cx5hcz
   */
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) If token verify then check if user still exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // 4) Check if user changed password after the token was issued

  next();
});
