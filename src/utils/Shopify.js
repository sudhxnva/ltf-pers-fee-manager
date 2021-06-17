const Shopify = require('shopify-api-node');
const log = require('../config/logger');
const { shopify: shopifyEnv, host } = require('../config/config');
const {
  beginEdit,
  addCustomItemToOrder,
  changeLineItemQuantity,
  commitEdit,
  registerWebhookMutation,
} = require('./ShopifyMutations');

class ShopifyHandler {
  constructor() {
    this.shopify = new Shopify({
      shopName: shopifyEnv.SHOP,
      apiKey: shopifyEnv.API_KEY,
      password: shopifyEnv.API_PASSWD,
    });
  }

  async newPersItemExists(orderId) {
    const order = await this.shopify.order.get(orderId);
    for (const lineItem of order.line_items) {
      if (lineItem.title === 'Personalization Fee' && lineItem.product_id === null) {
        return true;
      }
    }
    return false;
  }

  // Refer to resource https://shopify.dev/tutorials/edit-an-existing-order-with-admin-api for the following flow
  async addNewPersItem(gid, persLineItem) {
    // Begin editing the order
    const {
      orderEditBegin: { calculatedOrder },
    } = await this.shopify.graphql(beginEdit(gid));

    // Delete the old "Personalization Fee" line item
    const lineItem = calculatedOrder.lineItems.edges.find(
      (l) => l.node.title === 'Personalization Fee' && l.node.quantity > 1
    );
    await this.shopify.graphql(changeLineItemQuantity(calculatedOrder.id, lineItem.node.id, 0));

    // Add the new "Personalization Fee" line item
    await this.shopify.graphql(
      addCustomItemToOrder(calculatedOrder.id, 'Personalization Fee', Number(persLineItem.price), persLineItem.quantity)
    );

    // Complete the order edit and commit it to Shopify
    const {
      orderEditCommit: { order },
    } = await this.shopify.graphql(commitEdit(calculatedOrder.id));
    log.info(
      `Order: ${order.id.split('/')[4]} modified. Original Pers Quantity = ${persLineItem.quantity} ($${
        persLineItem.quantity * 0.01
      })`
    );
  }

  async registerWebhook(topic) {
    const callbackUrl = host + '/webhook/order';

    // Check if webhook already exists
    const webhooks = await this.shopify.webhook.list();
    const registeredWebhook = webhooks.find((webhook) => webhook.address === callbackUrl && webhook.topic === topic);

    if (registeredWebhook) return log.info('Webhook exists. Skipping webhook registration');

    console.log(await this.shopify.webhook.create({ address: callbackUrl, topic }));
    return log.info(`Webhook registered for topic '${topic}'`);
  }

  async deleteWebhook(topic) {
    const callbackUrl = host + '/webhook/order';

    // Check if webhook  exists
    const webhooks = await this.shopify.webhook.list();
    const registeredWebhook = webhooks.find((webhook) => webhook.address === callbackUrl && webhook.topic === topic);

    if (!registeredWebhook) return log.error('Webhook does not exist. Aborting deletion');

    console.log(await this.shopify.webhook.delete(registeredWebhook.id));
    log.info(`Webhook for topic: '${topic}' deleted successfully`);
  }
}

module.exports = ShopifyHandler;
