const { persFeeId } = require('../config/config');
const ShopifyHandler = require('../utils/Shopify');

async function orderWebhookHandler(req, res) {
  // Send 200 OK response first and then process order asynchronously. (Webhooks have a timeout of 5s)
  res.sendStatus(200);

  const order = req.body;
  let originalPersLineItems = [];
  let addPersLineItems = [];

  for (const lineItem of order.line_items) {
    if (lineItem.product_id !== persFeeId) continue;
    if (lineItem.quantity === 1) continue; // Replacing line item not necessary since quantity is only 1
    originalPersLineItems.push(lineItem);
  }
  // If no personalization fee items in order, abort
  if (!originalPersLineItems.length) return;

  const shop = new ShopifyHandler();

  for (const persLineItem of originalPersLineItems) {
    const addFeeID = persLineItem.properties.find((property) => property.name === '_addFeeID').value;
    const parentItem = order.line_items.find(
      ({ title, properties }) =>
        title !== 'Personalization Fee' &&
        properties.find((property) => property.name === '_addFeeID') &&
        properties.find((property) => property.name === '_addFeeID').value === addFeeID
    );
    const itemIdentifier = parentItem.sku || parentItem.title;

    // If new "Personalization Fee" item already exists, abort
    const itemExists = await shop.newPersItemExists(order.id, itemIdentifier);
    if (itemExists) continue;

    persLineItem.itemIdentifier = itemIdentifier;
    persLineItem.addFeeID = addFeeID;
    addPersLineItems.push(persLineItem);
  }

  if (addPersLineItems.length) shop.addNewPersItems(order.admin_graphql_api_id, addPersLineItems);
}

module.exports = {
  orderWebhookHandler,
};
