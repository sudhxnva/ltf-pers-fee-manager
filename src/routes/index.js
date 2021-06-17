const express = require('express');
const { orderWebhookHandler } = require('../middleware/webhookHandler');
const { verifyWebhook } = require('../middleware/verifyWebhook');
const router = express.Router();

// Base endpoint (for uptime checking)
router.get('/', (req, res) => {
  res.send('LTF - Personalization Fee Manager');
});

// Verify that request came from Shopify
router.use(verifyWebhook);

router.post('/order', orderWebhookHandler);

module.exports = router;
