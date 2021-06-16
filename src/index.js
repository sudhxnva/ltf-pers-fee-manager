const app = require("./app");

const server = app.listen(3000, () => {
  console.log(`Listening to port 3000`);
});

const exitHandler = () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(1);
  });
};

const unexpectedErrorHandler = (error) => {
  console.log(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  server.close();
});
