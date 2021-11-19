const { PERS_FEE_ID, FC_SEND_ORDER_URL, FC_ORDER_INPUT_KEY, FC_CUST_NUM } = require('../config');
const ShopifyHandler = require('../utils/Shopify');
const { cleanObject } = require('../utils');
const js2xmlparser = require('js2xmlparser');
const axios = require('axios').default;
const encodeUrl = require('encodeurl');
const logger = require('../config/logger');
const { Sentry } = require('../config/errorMonitoring');

async function orderHandler(req, res) {
  // Send 200 OK response first and then process order asynchronously. (Webhooks have a timeout of 5s)
  res.sendStatus(200);

  const order = req.body;
  let originalPersLineItems = [];
  let fashioncraftLineItems = [];
  let addPersLineItems = [];

  for (const lineItem of order.line_items) {
    if (lineItem.vendor === 'Fashioncraft') fashioncraftLineItems.push(lineItem);
    if (lineItem.product_id !== PERS_FEE_ID) continue;
    if (lineItem.quantity === 1) continue; // Replacing line item not necessary since quantity is only 1
    originalPersLineItems.push(lineItem);
  }

  // If an order has FC line items, trigger workflow to send order to FC
  if (fashioncraftLineItems.length) fashioncraftOrderHandler(order, fashioncraftLineItems);

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

async function fashioncraftOrderHandler(order, lineItems) {
  const shipping = order.shipping_address;
  const dropShipInfo = {
    name: shipping.first_name + ' ' + shipping.last_name,
    country: 'US',
    address1: shipping.address1,
    address2: shipping.address2,
    city: shipping.city,
    stateProvince: shipping.province,
    zip: shipping.zip,
    phone: shipping.phone,
  };

  let shippingMethod;
  let [item, glassItem, personalizedItem, tag] = [[], [], [], []];
  switch (order.shipping_lines.code) {
    case 'FEDEX_2_DAY':
    case 'TWO_DAY_AIR':
    case 'BY_PRICE_2_DAY':
      shippingMethod = '2ND DAY AIR';
      break;
    case 'FEDEX_STD_OVERNIGHT':
    case 'NEXT_DAY_AIR':
    case 'BY_PRICE_EXPEDITED':
      shippingMethod = 'NEXT DAY AIR';
      break;
    default:
      shippingMethod = 'GROUND';
  }
  for (const lineItem of lineItems) {
    let { value: designID } = lineItem.properties.find((prop) => prop.name == '_FC Design ID');
    let { value: productType } = lineItem.properties.find((prop) => prop.name == '_FC_product_type');
    if (!designID) continue;
    let obj = {
      number: lineItem.sku.split('FC-')[1],
      quantity: lineItem.quantity,
      DesignIDNumber: designID,
    };

    switch (productType) {
      case 'personalizedItem':
        personalizedItem.push(obj);
        break;
      case 'glassItem':
        glassItem.push(obj);
        break;
      case 'tag':
        tag.push(obj);
        break;
      default:
        item.push(obj);
        break;
    }
  }

  const orderObj = {
    custNum: FC_CUST_NUM,
    orderInputKey: FC_ORDER_INPUT_KEY,
    poNum: 'TEST', // TODO: Switch to real order name when FC approves
    shippingService: 'UPS',
    shippingMethod,
    dropShipInfo,
    ...(item.length > 0 && { item }),
    ...(personalizedItem.length > 0 && { personalizedItem }),
    ...(glassItem.length > 0 && { glassItem }),
    ...(tag.length > 0 && { tag }),
  };
  const xmlOrderPayload = js2xmlparser.parse('order', cleanObject(orderObj), {
    declaration: { encoding: 'utf-8', version: '1.0' },
  });

  const res = await axios.post(`${FC_SEND_ORDER_URL}/?beta=1&order=${encodeUrl(xmlOrderPayload)}`, null); // TODO: Remove beta flag when FC approves

  if (res.data === 1) return logger.info(`LTF Order ${order.name} accepted by FC`);

  const [statusCode, message] = res.data.split(',');
  switch (statusCode) {
    case '0':
      const errorMessage = `LTF Order ${order.name} rejected by FC with the message: ${message}`;
      logger.error(errorMessage);
      Sentry.captureMessage(errorMessage);
      break;
    case '1':
      logger.info(`LTF Order ${order.name} accepted by FC with message: ${message}`);
  }
}

module.exports = {
  orderHandler,
};
