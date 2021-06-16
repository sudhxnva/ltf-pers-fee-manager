const app = require('./app');
const config = require('./config/config');
const log = require('./config/logger');

const server = app.listen(config.port, () => {
  log.info(`Listening to port ${config.port}`);
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

process.on('SIGTERM', () => {
  log.info('SIGTERM received');
  server.close();
});

process.on('SIGINT', () => {
  log.info('SIGINT received');
  server.close();
});
