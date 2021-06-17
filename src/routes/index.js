const express = require('express');
const { orderWebhookHandler } = require('../middleware/webhookHandler');

const router = express.Router();

router.get('/', (req, res) => {
  res.send('LTF - Personalization Fee Manager');
});

router.post('/order', orderWebhookHandler);

module.exports = router;
