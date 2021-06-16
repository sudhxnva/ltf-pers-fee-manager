const express = require('express');
const { orderWebhookHandler } = require('../middleware/webhookHandler');

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Working Endpoint');
});

router.post('/order', orderWebhookHandler);

module.exports = router;
