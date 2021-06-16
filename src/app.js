const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/config');
const morgan = require('./config/morgan');
const httpStatus = require('http-status');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(morgan.successHandler);
app.use(morgan.errorHandler);

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// enable cors
app.use(cors());
app.options('*', cors());

app.get('/', (req, res) => {
  res.send('Working Endpoint');
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

module.exports = app;
