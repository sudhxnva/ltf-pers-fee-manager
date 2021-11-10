const { PERS_FEE_ID } = require('../config');
const ShopifyHandler = require('../utils/Shopify');
const js2xmlparser = require('js2xmlparser');
const axios = require('axios').default;

async function orderWebhookHandler(req, res) {
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
    let { value: productType } = lineItem.properties.find((prop) => (prop.name = '_FC_product_type'));
    if (!designID) continue;
    const { data } = axios.get(`FC-URL=${designID}`); // TODO: Add to config file
    let obj = {
      number: lineItem.sku.split('FC-')[1],
      quantity: lineItem.quantity,
    };

    if (productType == 'personalizedItem') {
      obj = {
        ...obj,
        layout: data.layout,
        backgroundColor: data.backgroundColor,
        graphic: data.graphicID,
        border: data.border,
        pattern: data.pattern,
        font: data.font,
        DesignText: data.designText,
        textLine1: data.textLine1,
        textLine2: data.textLine2,
        textLine3: data.textLine3,
        DesignIDNumber: data.siteID,
        textType: data.textType,
        textColor: data.textColor,
        borderColor: data.borderBottomColor,
        pattern: data.pattern,
        patternColor: data.patternColor,
        line1Color: data.textLine1Color,
        line2Color: data.textLine2Color,
        RushProduction: Number(data.RushProduction) != 0 ? 'yes' : undefined,
        Assemble: Number(data.RushProduction) != 0 ? 'yes' : undefined,
      };
      personalizedItem.push(obj);
      continue;
    }

    if (productType == 'glassItem') {
      obj = {
        ...obj,
        name1: data.textLine1,
        name2: data.textLine2,
        font: data.font,
        MonogramText: data.monogramLetters,
        DesignText: data.designText,
        DesignIDNumber: siteID,
        RushProduction: Number(data.RushProduction) != 0 ? 'yes' : undefined,
      };
      glassItem.push(obj);
      continue;
    }

    if (productType == 'tag') {
      obj = {
        ...obj,
        backgroundColor: data.backgroundColor,
        borderColor: data.borderBottomColor,
        pattern: data.pattern,
        patternColor: data.patternColor,
        graphic: data.graphicID,
        font: data.font,
        line1Color: data.textLine1Color,
        DesignText: data.designText,
        textLine1: data.textLine1,
        textLine2: data.textLine2,
        type: tagsOrStickers,
        DesignIDNumber: data.siteID,
      };
      tag.push(obj);
      continue;
    }

    item.push(obj);
  }

  const orderObj = {
    custNum: 1234, // TODO: Get FC customer number
    orderInputKey: 'inputkey', // TODO: Add to config file
    poNum: order.id,
    shippingService: 'UPS', // TODO: Check with Mike about this
    shippingMethod,
    dropShipInfo,
    item: item.length > 0 ? item : undefined,
    personalizedItem: personalizedItem.length > 0 ? personalizedItem : undefined,
    glassItem: glassItem.length > 0 ? glassItem : undefined,
    tag: tag.length > 0 ? tag : undefined,
  };
  xmlOrderPayload = js2xmlparser.parse('order', orderObj, { declaration: { encoding: 'UTF-8', version: '1.0' } });

  const res = await axios.post('FC-Url', xmlOrderPayload, {
    // TODO: Add URL
    headers: { 'Content-Type': 'text/xml' },
  });
  console.log(res.data);
}

module.exports = {
  orderWebhookHandler,
};
