const crypto = require('crypto');
const log = require('../config/logger');
const { webhookSecret } = require('../config/config');
const { Sentry } = require('../config/errorMonitoring');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

async function verifyWebhook(req, res, next) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');

  const hash = crypto.createHmac('sha256', webhookSecret).update(req.rawBody, 'utf8', 'hex').digest('base64');

  if (hash === hmac) {
    // Signature verified. Request is from Shopify
    next();
  } else {
    // Error. Request didn't originate from Shopify
    log.warn("Request didn't originate from Shopify");
    Sentry.captureException(new ApiError(httpStatus.UNAUTHORIZED, "Request didn't originate from Shopify"));
    return res.status(401).send("Request didn't originate from Shopify");
  }
}

module.exports = { verifyWebhook };
