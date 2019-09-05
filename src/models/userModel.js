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
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8
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
      }
    }
  },
  // Options
  {
    // to enable showing virtuals fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with the cost 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});


const User = mongoose.model('User', userSchema);
module.exports = User;
