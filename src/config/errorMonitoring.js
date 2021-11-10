const Sentry = require('@sentry/node');
const { isProd, SENTRY_DSN } = require('.');

// or use es6 import statements
// import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: isProd ? SENTRY_DSN : null,
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
