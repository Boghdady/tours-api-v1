const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

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
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
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
  // console.log(decoded);
  /*
       Tow types of token error May happen here:
       1- token changed
       2- token expired
       so we handle them in global handling errorController instead of try catch
      */

  // 3) If token verify then check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    // That mean the token is valid but the user is deleted
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // 4) Check if user changed password after the token was issued or stolen or hacked or any reasons
  // iat => is the timestamp for decoded token
  if (currentUser.checkIfUserChangedPassword(decoded.iat)) {
    return next(new AppError('User recently changed password! Please login again.', 401));
  }

  // 5) Grant access to protected route
  // this req.user will be available in the next middleware
  req.user = currentUser;
  next();
});

// Authorization : authorize only certain types of users to perform certain actions
// if the verified user is allowed to access a certain resource, not all the logged in users
// will be able to perform the same actions in our API
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    /*
     roles are array of args that coming from route.
     ex: ['admin', 'guide-lead'] and if no args send that
     mean req.user.role= 'user' by default
     */
    // req.user coming from protect method handler
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this actions', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user for this email address', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.generatePasswordResetToken();
  // We modify hashed passwordResetToken, passwordResetExpires so we want to save it in db
  user.save({ validateBeforeSave: false });
  // user.save();

  // 3) Send token to user's email
  /* Here we send the original token without encrypted, the encrypted in the db,
   the next step (resetPassword) we will compare the original ond with the encrypted token in the bd
   note : we can sent code instead of reset URL in case mobile application or create random code
   and send it via sms provider
   */
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and 
  passwordConfirm to : ${resetUrl}.\n If you didn't forgot your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'Success',
      message: 'Token sent to your email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }

});

exports.resetPassword = catchAsync(async (req, res, next) => {
});