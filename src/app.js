const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Sentry } = require('./config/errorMonitoring');
const morgan = require('./config/morgan');
const httpStatus = require('http-status');
const routes = require('./routes');
const ApiError = require('./utils/ApiError');

const app = express();

// Sentry Error Monitoring
app.use(Sentry.Handlers.requestHandler());

app.use(morgan.successHandler);
app.use(morgan.errorHandler);

// set security HTTP headers
app.use(helmet());

// parse json request body and store raw buffer in req.rawBody for verifyWebhook middleware
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// enable cors
app.use(cors());
app.options('*', cors());

app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// Main routes
app.use('/webhook', routes);

app.use(
  Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all 404 and 500 errors
      if (error.status === 404 || error.status === 500) return true;
      return false;
    },
  })
);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  Sentry.captureException(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
  res.sendStatus(404);
});

module.exports = app;
