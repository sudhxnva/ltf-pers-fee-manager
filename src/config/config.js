const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const {
  value: { DEV_STORE },
  error: errorDev,
} = Joi.object()
  .keys({ DEV_STORE: Joi.boolean().default(false) })
  .unknown()
  .validate(process.env);

if (errorDev) throw new Error(`Config validation error: ${errorDev.message}`);

const shopifyEnv = DEV_STORE === false ? '' : 'DEV_';

const authSchema = {};
authSchema[shopifyEnv + 'SHOP'] = Joi.string()
  .regex(/[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com/)
  .required();
authSchema[shopifyEnv + 'API_KEY'] = Joi.string().required();
authSchema[shopifyEnv + 'API_PASSWD'] = Joi.string().required();

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development').required(),
    PORT: Joi.number().default(3000),
    PERS_FEE_ID: Joi.number().required(),
    PERS_FEE_EDIT_MSG: Joi.string().required(),
    ...authSchema,
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) throw new Error(`Config validation error: ${error.message}`);

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  persFeeId: envVars.PERS_FEE_ID,
  persFeeEditMessage: envVars.PERS_FEE_EDIT_MSG,
  shopify: {
    SHOP: envVars[shopifyEnv + 'SHOP'],
    API_KEY: envVars[shopifyEnv + 'API_KEY'],
    API_PASSWD: envVars[shopifyEnv + 'API_PASSWD'],
  },
};
