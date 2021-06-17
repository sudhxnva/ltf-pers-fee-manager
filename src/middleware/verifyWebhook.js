const crypto = require('crypto');
const log = require('../config/logger');
const { webhookSecret } = require('../config/config');

async function verifyWebhook(req, res, next) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');

  const hash = crypto.createHmac('sha256', webhookSecret).update(req.rawBody, 'utf8', 'hex').digest('base64');

  if (hash === hmac) {
    // Signature verified. Request is from Shopify
    next();
  } else {
    // Error. Request didn't originate from Shopify
    log.warn("Request didn't originate from Shopify");
    return res.status(401).send("Request didn't originate from Shopify");
  }
}

module.exports = { verifyWebhook };
