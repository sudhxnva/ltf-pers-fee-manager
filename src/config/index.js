const dotenv = require('dotenv');
const { cleanEnv, str, port, url, num } = require('envalid');

dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production'] }),
  PORT: port({ default: 3000 }),
  HOST: url({ desc: 'HOST URL the app is running on' }),
  PERS_FEE_ID: num({ desc: 'Personalization Fee Product ID on Shopify' }),
  PERS_FEE_EDIT_MSG: str({ default: 'Personalization Fee quantity updated', desc: 'Message added after editing order' }),
  PERS_FEE_ITEM_TITLE: str({ default: 'Personalization Fee', desc: 'Name of the personalization fee item' }),
  WEBHOOK_SECRET: str({ desc: 'Webhook Integrity Secret' }),
  SENTRY_DSN: url({ desc: 'Sentry Error handling DSN' }),
  SHOP: str({ default: 'littlethings-favors.myshopify.com', desc: 'myshopify URL of store' }),
  API_KEY: str({ desc: 'Shopify API Key' }),
  API_PASSWD: str({ desc: 'Shopify API Secret' }),
  FC_ORDER_INPUT_KEY: str({ desc: 'FashionCraft Order Input Key' }),
  FC_CUST_NUM: num({ desc: 'Fashioncraft customer number' }),
  FC_GET_ORDER_URL: url({ desc: 'URL to get personalization details of FC order' }),
  FC_SEND_ORDER_URL: url({ desc: 'POST endpoint to send an FC order to' }),
});

module.exports = env;
