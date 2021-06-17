const Shopify = require('shopify-api-node');
const log = require('../config/logger');
const { shopify: shopifyEnv, env } = require('../config/config');
const { beginEdit, addCustomItemToOrder, changeLineItemQuantity, commitEdit } = require('./ShopifyMutations');

class ShopifyHandler {
  constructor() {
    const shopifyCredentials =
      env === 'development'
        ? {
            shopName: shopifyEnv.DEV_SHOP,
            apiKey: shopifyEnv.DEV_API_KEY,
            password: shopifyEnv.DEV_API_PASSWD,
          }
        : {
            shopName: shopifyEnv.SHOP,
            apiKey: shopifyEnv.API_KEY,
            password: shopifyEnv.API_PASSWD,
          };

    this.shopify = new Shopify(shopifyCredentials);
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

  async addNewPersItem(gid, persLineItem) {
    const {
      orderEditBegin: { calculatedOrder },
    } = await this.shopify.graphql(beginEdit(gid));

    const lineItem = calculatedOrder.lineItems.edges.find((l) => l.node.title === 'Personalization Fee' && l.node.quantity > 1);
    await this.shopify.graphql(changeLineItemQuantity(calculatedOrder.id, lineItem.node.id, 0));

    await this.shopify.graphql(addCustomItemToOrder(calculatedOrder.id, 'Personalization Fee', Number(persLineItem.price), persLineItem.quantity));

    const {
      orderEditCommit: { order },
    } = await this.shopify.graphql(commitEdit(calculatedOrder.id));
    log.info(`Order: ${order.id.split('/')[4]} modified. Original Pers Quantity = ${persLineItem.quantity} ($${persLineItem.quantity * 0.01})`);
  }
}

module.exports = ShopifyHandler;
