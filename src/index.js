const app = require('./app');
const ShopifyHandler = require('./utils/Shopify');
const { port } = require('./config/config');
const log = require('./config/logger');
const shop = new ShopifyHandler();

const server = app.listen(port, () => {
  shop.registerWebhook('orders/create');

  log.info(`Listening to port ${port}`);
});

const exitHandler = () => {
  server.close(() => {
    log.info('Server closed');
    process.exit(1);
  });
};

const unexpectedErrorHandler = (error) => {
  log.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', async () => {
  log.info('SIGTERM received');
  await shop.deleteWebhook('orders/create');
  server.close();
});

process.on('SIGINT', async () => {
  log.info('SIGINT received');
  await shop.deleteWebhook('orders/create');
  server.close();
});
