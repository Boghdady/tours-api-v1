const mongoose = require('mongoose');
const validator = require('validator');

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
      required: [true, 'Confirm Password is required']
    }
  },
  // Options
  {
    // to enable showing virtuals fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });


const User = mongoose.model('User', userSchema);

module.exports = User;
