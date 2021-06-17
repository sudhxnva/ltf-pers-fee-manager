const { persFeeId } = require('../config/config');
const ShopifyHandler = require('../utils/Shopify');

async function orderWebhookHandler(req, res) {
  // Send 200 OK response first and then process order asynchronously. (Webhooks have a timeout of 5s)
  res.sendStatus(200);

  const order = req.body;
  let originalPersLineItem;

  for (const lineItem of order.line_items) {
    if (lineItem.product_id !== persFeeId) continue;
    if (lineItem.quantity === 1) return; // Replacing line item not necessary
    originalPersLineItem = lineItem;
  }
  // If no personalization fee in order, abort
  if (!originalPersLineItem) return;

  const shop = new ShopifyHandler();
  // If new "Personalization Fee" item already exists, abort
  const itemExists = await shop.newPersItemExists(order.id);
  if (itemExists) return;

  shop.addNewPersItem(order.admin_graphql_api_id, originalPersLineItem);
}

module.exports = {
  orderWebhookHandler,
};
