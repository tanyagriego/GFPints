'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const {Business} = require('./models');
const router = express.Router();
const jsonParser = bodyParser.json();

// Post to register a new log
router.post('/', jsonParser, (req, res) => {
  //console.log("this is my test");
  //console.log("Request body:", req.body);
  //return res.json('test string');
  
  return Business
    .create({
      business_name: req.body.business_name,
      business_id: req.body.business_id,
      business_webiste: req.body.business_webiste,
      hours_open: req.body.hours_open,
      hours_close: req.body.hours_close
    })
      .then(
      business => res.status(201).json(business.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    })
});

router.get('/', (req, res) => {
  return res.json('test string');
});

router.delete('/', (req, res) => {
  return res.json('test string');
});

router.put('/', (req, res) => {
  return res.json('test string');
});

module.exports = {router};
