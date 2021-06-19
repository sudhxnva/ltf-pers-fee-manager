const Sentry = require('@sentry/node');
const { sentryDsn, env } = require('../config/config');

// or use es6 import statements
// import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: env === 'production' ? sentryDsn : null,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

module.exports = {
  Sentry,
};
