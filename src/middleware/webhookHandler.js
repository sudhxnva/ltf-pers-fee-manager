const { persFeeId } = require('../config/config');
const ShopifyHandler = require('../utils/Shopify');

async function orderWebhookHandler(req, res) {
  res.status(200).send('OK');
  const order = req.body;
  let originalPersLineItem;
  for (const lineItem of order.line_items) {
    if (lineItem.product_id !== persFeeId) continue;
    if (lineItem.quantity === 1) return; // Replacing line item not necessary
    originalPersLineItem = lineItem;
  }
  if (!originalPersLineItem) return;

  const shop = new ShopifyHandler();
  const itemExists = await shop.newPersItemExists(order.id);
  if (itemExists) return;

  shop.addNewPersItem(order.admin_graphql_api_id, originalPersLineItem);
}

module.exports = {
  orderWebhookHandler,
};
