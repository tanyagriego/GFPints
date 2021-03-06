'use strict';
const express = require('express');
const bodyParser = require('body-parser');

const { User } = require('./models');
const { Beers } = require("../beers/models")

const router = express.Router();

const jsonParser = bodyParser.json();

// Post to register a new user
router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const stringFields = ['username', 'password', 'first_name', 'last_name'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 6,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  let {username, password, first_name = '', last_name = ''} = req.body;
  // Username and password come in pre-trimmed, otherwise we throw an error
  // before this
  first_name = first_name.trim();
  last_name = last_name.trim();

  return User.find({username})
    .count()
    .then(count => {
      if (count > 0) {
        // There is an existing user with the same username
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      // If there is no existing user, hash the password
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        username,
        password: hash,
        first_name,
        last_name
      });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
});

router.get('/', (req, res) => {
  console.log("req:", req);
  return User.find()
    .then(users => res.json(users.map(user => user.serialize())))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

// Post the favorite to a specific user
router.get(`/:id/favorites`, (req, res) => {
  const userId = req.params.id

  return User
  .findById(userId)
  .then(user => { 
    Beers.find( { _id: { $in: user.favorites }} )
      .then(result => res.json(result))
    })
  .catch(err => res.status(500).json({message: err.message}))
  })

router.put(`/:id/favorites`, jsonParser, (req, res) => {
  const favoriteBeerId = req.body.favorite_beer_id;
  const userId = req.params.id;

  console.log("Put request:", req.body);
  let newFavorites;
  return User
  .findById(userId)
  .then(user => {
    const {favorites} = user;
    console.log('user==================================\n:', user);
    newFavorites = favorites?[...user.favorites, favoriteBeerId]:[favoriteBeerId]
    User
    .findByIdAndUpdate(userId, {favorites: newFavorites})
    .then((updatedUser) => {
      console.log('updated user:', updatedUser);
      res.status(204).json(updatedUser);
  })
  .catch(err => {
    console.log("error:", err)
    res.status(500).json({error: err.message});
    })
  })
});


module.exports = {router};
