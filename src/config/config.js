const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development').required(),
    PORT: Joi.number().default(3000),
    PERS_FEE_ID: Joi.number().required(),
    DEV_SHOP: Joi.string().regex(/[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com/),
    DEV_API_KEY: Joi.string(),
    DEV_API_PASSWD: Joi.string(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  persFeeId: envVars.PERS_FEE_ID,
  shopify: {
    DEV_SHOP: envVars.DEV_SHOP,
    DEV_API_KEY: envVars.DEV_API_KEY,
    DEV_API_PASSWD: envVars.DEV_API_PASSWD,
  },
};
