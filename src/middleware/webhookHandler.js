const order = require('../../test');
const log = require('../config/logger');
const { persFeeId } = require('../config/config');

function orderWebhookHandler(req, res) {
  for (const lineItem of order.line_items) {
    if (lineItem.product_id !== persFeeId) continue;
    if (lineItem.quantity === 1) break; // Replacing line item not necessary
  }

  res.status(200);
}

module.exports = {
  orderWebhookHandler,
};
