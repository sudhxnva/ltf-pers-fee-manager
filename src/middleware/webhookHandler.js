const { persFeeId } = require('../config/config');
const ShopifyHandler = require('../utils/Shopify');

async function orderWebhookHandler(req, res) {
  const order = req.body;
  let originalPersLineItem;
  for (const lineItem of order.line_items) {
    if (lineItem.product_id !== persFeeId) continue;
    if (lineItem.quantity === 1) return res.status(200).send('OK'); // Replacing line item not necessary
    originalPersLineItem = lineItem;
  }
  if (!originalPersLineItem) return res.status(200).send('OK');

  const shop = new ShopifyHandler();
  const itemExists = await shop.newPersItemExists(order.id);
  if (itemExists) return res.status(200).send('OK');

  await shop.addNewPersItem(order.admin_graphql_api_id, originalPersLineItem);

  res.status(200).send('OK');
}

module.exports = {
  orderWebhookHandler,
};
