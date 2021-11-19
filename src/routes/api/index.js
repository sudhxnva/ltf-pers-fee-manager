const express = require('express');
const router = express.Router();

const log = require('../../config/logger');
const { WEBHOOK_SECRET } = require('../../config');
const { orderHandler } = require('../../middleware/orderHandler');

router.use((req, res, next) => {
  if (req.get('x-secret') === WEBHOOK_SECRET) next();
  else {
    log.warn('Unauthorized request');
    res.status(401).send('Unauthorized request');
  }
});

router.post('/order', orderHandler);

module.exports = router;
