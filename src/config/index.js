const dotenv = require('dotenv');
const path = require('path');
const { cleanEnv, str, port, url, num } = require('envalid');

dotenv.config({ path: path.join(__dirname, '../../.env') });

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
});

module.exports = env;
