const crypto = require('crypto');
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

/*
cookie is small piece of text that a server can send to clients, then when client
receives a cookie it automatically store it and send back along with all future
request to the same server
 */
const createSendToken = (user, statusCode, res) => {
  const token = createToken(user._id);
  const cookieOptions = {
    // the browser or the client in general will delete the cookie after it has expired = 90d
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    /*
    This mean the cookie will only be sent on an encrypted connection (HTTPS),
    activate it in production, because it need https
     */
    // secure: true,
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // Create cookie and send jwt via cookie
  res.cookie('jwt', token, cookieOptions);

  // Hide password from response for security measure
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // These fields are needed for signin
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    // passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });
  // Create token for the new user
  createSendToken(newUser, 201, res);
  // const token = createToken(newUser._id);
  //
  // res.status(201).json({
  //   status: 'success',
  //   token: token,
  //   data: {
  //     user: newUser
  //   }
  // });
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
  createSendToken(user, 200, res);
  // const token = createToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  // 1) Getting token and check if it exist
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
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
  // 1) Get user based on the token or compare the token that coming from url with token in db
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save({ validateBeforeSave: true });

  // 3) I Updated changePasswordAt property for the current user using middleware in the user model

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);

  // const token = createToken(user._id);
  // res.status(200).json({
  //   status: 'Success',
  //   token
  // });
});

/*
    We want to allow the user to change his password after login
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if current password is correct
  if (!(await user.checkCorrectPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) If correct, set new password and automatically passwordChangedAt property will updated
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save({ validateBeforeSave: true });

  /*
    note :  we did not use this User.findByIdAndUpdate() because pre middleware and
    userSchema validator will not work, it only work with save
   */

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);

  // const token = createToken(user._id);
  //
  // res.status(200).json({
  //   status: 'Success',
  //   token
  // });
});

// Rate Limiting:  Limit the number of requests that coming from one single ip
// implementing maximum number of login attempts
// we should not save token in local storage instead store it in http cookies

/*
 Preventing parameter pollution :
 */