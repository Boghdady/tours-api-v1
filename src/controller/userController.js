const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./../controller/handlerFactory');


// Middleware to upload user image to storage directly
// const multerStorage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, 'src/public/img/users');
//   },
//   // By default, multer removes file extensions so let's add them back
//
//   filename: function(req, file, cb) {
//     const ext = file.originalname.split('.')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const imageFilter = function(req, file, cb) {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new AppError('Only image files are allowed!', 400), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: imageFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next;
  // When we store image in memory there is no filename property in the req.file so we need to redefined it because we will use it in updateMe middleware
  req.file.filename = `user-${req.user.id}.jpeg`;
  // Image processing
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`src/public/img/users/${req.file.filename}`);

  next();
});


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

exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//
//   const users = await User.find({});
//
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: { users }
//   });
// });
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead'
  });
};

// Middleware to get the userId from logged user, and assign it to req.params.id
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
// Update current user data
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);
  // // 1) Create error if user send password in the body
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for update password. You should not send password in the body', 400));
  }
  // 2) Filtered out unwanted fields names that are not allowed to updated
  // filterObj => method take an object and return object with properties that i need to update
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename; // add photo name to db
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
exports.getUser = factory.getOne(User);

// Do NOT update password with factory.updateOne! because we use findOneAndUpdate() => some middleware will not work
exports.updateUser = factory.updateOne(User);
// Admin only can perform this action
exports.deleteUser = factory.deleteOne(User);

