'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  first_name: {type: String, default: ''},
  last_name: {type: String, default: ''},
  favorites: {type: Array}
});

UserSchema.methods.serialize = function() {
  return {
    id: this._id || '',
    username: this.username || '',
    first_name: this.first_name || '',
    last_name: this.last_name || '',
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = {User};
