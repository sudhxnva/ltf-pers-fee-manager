const express = require('express');
const { orderWebhookHandler } = require('../middleware/webhookHandler');
const { verifyWebhook } = require('../middleware/verifyWebhook');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('LTF - Personalization Fee Manager');
});

router.use(verifyWebhook);

router.post('/order', orderWebhookHandler);

module.exports = router;
