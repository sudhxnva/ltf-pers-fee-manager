const app = require('./app');
const ShopifyHandler = require('./utils/Shopify');
const { PORT } = require('./config');
const log = require('./config/logger');
const { Sentry } = require('./config/errorMonitoring');
const shop = new ShopifyHandler();

const server = app.listen(PORT, () => {
  shop.registerWebhook('orders/create');

  log.info(`App listening on port: ${PORT}`);
});

const exitHandler = async () => {
  await shop.deleteWebhook('orders/create');
  server.close(() => {
    log.info('Server closed');
    process.exit(1);
  });
};

const unexpectedErrorHandler = (error) => {
  Sentry.captureException(error);
  log.error(error);
  exitHandler();
};

const termHandler = (signal) => {
  return async () => {
    log.info(`${signal} received`);
    await shop.deleteWebhook('orders/create');
    server.close();
    process.exit(0);
  };
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', termHandler('SIGTERM'));

process.on('SIGINT', termHandler('SIGINT'));
