const Shopify = require('shopify-api-node');
const log = require('../config/logger');
const { shopify: shopifyEnv, host, persFeeItemTitle } = require('../config/config');
const { beginEdit, addCustomItemToOrder, changeLineItemQuantity, commitEdit } = require('./ShopifyMutations');

class ShopifyHandler {
  constructor() {
    this.shopify = new Shopify({
      shopName: shopifyEnv.SHOP,
      apiKey: shopifyEnv.API_KEY,
      password: shopifyEnv.API_PASSWD,
    });
  }

  // Checks if the new pers item has already been added to the order
  async newPersItemExists(orderId, identifier) {
    const order = await this.shopify.order.get(orderId);
    for (const lineItem of order.line_items) {
      if (lineItem.title === `${persFeeItemTitle} - ${identifier}` && lineItem.product_id === null) {
        return true;
      }
    }
    return false;
  }

  // Refer to resource https://shopify.dev/tutorials/edit-an-existing-order-with-admin-api for the following flow
  async addNewPersItems(gid, persLineItems) {
    // Begin editing the order
    const {
      orderEditBegin: { calculatedOrder },
    } = await this.shopify.graphql(beginEdit(gid));

    // Iteration for if multiple pers fee items exist
    for (const persLineItem of persLineItems) {
      // Delete the old "Personalization Fee" line item
      const lineItem = calculatedOrder.lineItems.edges.find(
        (l) =>
          l.node.customAttributes.find((attr) => attr.key === '_addFeeID') &&
          l.node.customAttributes.find((attr) => attr.key === '_addFeeID').value === persLineItem.addFeeID
      );
      await this.shopify.graphql(changeLineItemQuantity(calculatedOrder.id, lineItem.node.id, 0));

      // Add a new Personalization Fee line item of single quantity
      await this.shopify.graphql(
        addCustomItemToOrder(
          calculatedOrder.id,
          `${persFeeItemTitle} - ${persLineItem.itemIdentifier}`,
          Number(persLineItem.price),
          persLineItem.quantity
        )
      );

      log.info(`Original Pers Quantity = ${persLineItem.quantity} ($${persLineItem.quantity * 0.01})`);
    }

    // Complete the order edit and commit it to Shopify
    const {
      orderEditCommit: { order },
    } = await this.shopify.graphql(commitEdit(calculatedOrder.id));
    log.info(`Order: ${order.id.split('/')[4]} modified`);
  }

  async registerWebhook(topic) {
    const callbackUrl = host + '/webhook/order';

    // Check if webhook already exists
    const webhooks = await this.shopify.webhook.list();
    const registeredWebhook = webhooks.find((webhook) => webhook.address === callbackUrl && webhook.topic === topic);

    if (registeredWebhook) return log.info('Webhook exists. Skipping webhook registration');

    return log.info(`Webhook registered for topic '${topic}'`);
  }

  async deleteWebhook(topic) {
    const callbackUrl = host + '/webhook/order';

    // Check if webhook  exists
    const webhooks = await this.shopify.webhook.list();
    const registeredWebhook = webhooks.find((webhook) => webhook.address === callbackUrl && webhook.topic === topic);

    if (!registeredWebhook) return log.error('Webhook does not exist. Aborting deletion');

    log.info(`Webhook for topic: '${topic}' deleted successfully`);
  }
}

module.exports = ShopifyHandler;
