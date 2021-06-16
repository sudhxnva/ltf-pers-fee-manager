const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = express();

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// enable cors
app.use(cors());
app.options("*", cors());

app.get("/", (req, res) => {
  res.send("Working Endpoint");
});

app.listen(3000, () => {
  console.log(`Listening to port 3000`);
});
