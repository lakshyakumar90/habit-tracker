const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const androidConfig = process.env.GOOGLE_SERVICES_JSON || path.join(__dirname, 'google-services.json');
  const androidReady = fs.existsSync(androidConfig);
  return {
    ...config,
    android: { ...config.android, ...(androidReady ? { googleServicesFile: androidConfig } : {}) },
    plugins: [...(config.plugins ?? []), ...(androidReady ? ['@react-native-google-signin/google-signin'] : [])],
  };
};
