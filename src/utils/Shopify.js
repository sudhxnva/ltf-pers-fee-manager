const Shopify = require('shopify-api-node');
const log = require('../config/logger');
const { shopify: shopifyEnv, host, persFeeItemTitle } = require('../config/config');
const { beginEdit, addCustomItemToOrder, changeLineItemQuantity, commitEdit } = require('./ShopifyMutations');
const { Sentry } = require('../config/errorMonitoring');

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
    try {
      const order = await this.shopify.order.get(orderId);
      for (const lineItem of order.line_items) {
        if (lineItem.title === `${persFeeItemTitle} - ${identifier}` && lineItem.product_id === null) {
          return true;
        }
      }
      return false;
    } catch (error) {
      Sentry.captureException(error);
      log.error(error);
    }
  }

  // Refer to resource https://shopify.dev/tutorials/edit-an-existing-order-with-admin-api for the following flow
  async addNewPersItems(gid, persLineItems) {
    try {
      // Begin editing the order
      const {
        orderEditBegin: { calculatedOrder },
      } = await this.shopify.graphql(beginEdit(gid));
      let initQuantity = 0;

      // Iteration for if multiple pers fee items exist
      for (const persLineItem of persLineItems) {
        // Delete the old "Personalization Fee" line item
        const lineItem = calculatedOrder.lineItems.edges.find(
          (l) =>
            l.node.customAttributes.find((attr) => attr.key === '_addFeeID') &&
            l.node.customAttributes.find((attr) => attr.key === '_addFeeID').value === persLineItem.addFeeID
        );
        await this.shopify.graphql(changeLineItemQuantity(calculatedOrder.id, lineItem.node.id, 0));

        console.log(persLineItem);

        console.log(
          addCustomItemToOrder(
            calculatedOrder.id,
            `${persFeeItemTitle} - ${persLineItem.itemIdentifier}`,
            Number(persLineItem.price),
            persLineItem.quantity
          )
        );

        // Add a new Personalization Fee line item of single quantity
        await this.shopify.graphql(
          addCustomItemToOrder(
            calculatedOrder.id,
            `${persFeeItemTitle} - ${persLineItem.itemIdentifier}`,
            Number(persLineItem.price),
            persLineItem.quantity
          )
        );

        initQuantity += +persLineItem.quantity;
      }

      // Complete the order edit and commit it to Shopify
      const {
        orderEditCommit: { order },
      } = await this.shopify.graphql(commitEdit(calculatedOrder.id));
      log.info(
        `Order: ${order.id.split('/')[4]} modified. ${initQuantity} items reduced to ${persLineItems.length} item${
          persLineItems.length === 1 ? '' : 's'
        }`
      );
    } catch (error) {
      Sentry.captureException(error);
      log.error(error);
    }
  }

  async registerWebhook(topic) {
    try {
      const callbackUrl = host + '/webhook/order';
      log.info(`Watching store: ${shopifyEnv.SHOP}`);

      // Check if webhook already exists
      const webhooks = await this.shopify.webhook.list();
      const registeredWebhook = webhooks.find((webhook) => webhook.address === callbackUrl && webhook.topic === topic);

      if (registeredWebhook) return log.info('Webhook exists. Skipping webhook registration');

      await this.shopify.webhook.create({ address: callbackUrl, topic });

      return log.info(`Webhook registered for topic '${topic}' with callback URL: ${callbackUrl}`);
    } catch (error) {
      Sentry.captureException(error);
      log.error(error);
    }
  }

  async deleteWebhook(topic) {
    try {
      const callbackUrl = host + '/webhook/order';

      // Check if webhook  exists
      const webhooks = await this.shopify.webhook.list();
      const registeredWebhook = webhooks.find((webhook) => webhook.address === callbackUrl && webhook.topic === topic);

      if (!registeredWebhook) return log.error('Webhook does not exist. Aborting deletion');

      await this.shopify.webhook.delete(registeredWebhook.id);

      log.info(`Webhook for topic: '${topic}' deleted successfully`);
    } catch (error) {
      Sentry.captureException(error);
      log.error(error);
    }
  }
}

module.exports = ShopifyHandler;
