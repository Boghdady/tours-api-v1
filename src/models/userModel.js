const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      validate: [validator.isEmail, 'Should be email formatted'],
      unique: true,
      lowercase: true
    },
    phone: {
      type: String
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false // excluded or hide password from response
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Confirm Password is required'],
      validate: {
        // This only works on (create and save) so this validation will not work in findOneAndUpdate
        validator: function(val) {
          return val === this.password;
        },
        message: 'Password are not the same'
      },
      select: false // excluded or hide passwordConfirm from response
    },
    passwordChangedAt: Date,// The data where the password has been changed
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  // Options
  {
    // to enable showing virtuals fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

// Middleware that automatically run before save user document
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with the cost 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Middleware that automatically run before save user document
userSchema.pre('save', function(next) {
  // this.isNew mean => when create a new user
  if (!this.isModified('password') || this.isNew) return next();
  // we subtract 1 second to ensure that the token is always created after the password has been changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/*
  CREATE INSTANCE METHOD : method will be available in all the User documents

  ex: create method to check if the entire password from req.body equal the password
  in the database
 */
userSchema.methods.checkCorrectPassword = async function(entireBodyPassword, dbUserPassword) {
  // note :  this.password will be not available because we hide the password field in userSchema
  // return true if the same password and false is not the same
  return await bcrypt.compare(entireBodyPassword, dbUserPassword);
};

/*
  CREATE INSTANCE METHOD : method will be available in all the User documents
  - Check if user changed password after the token was issued or stolen or hacked or any reasons
  - JWTTimestamp the time of verifying the token
 */
userSchema.methods.checkIfUserChangedPassword = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    // Convert passwordChangedAt to timestamp
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    // console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; // that will return true and mean password has been changed
  }
  // false => That mean user has not changed his password after verifying the token
  return false;
};

/*
   Method to generate a random token for reset password
 */
userSchema.methods.generatePasswordResetToken = function() {
  // 1) Create a token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // 2) Hashed the token and save it to database
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  console.log({ resetToken }, ` Hashed Token : ${this.passwordResetToken}`);
  // 3) Adding expiration time for token (10 min for example)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
