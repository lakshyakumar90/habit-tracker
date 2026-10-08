const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const localConfig = path.join(__dirname, 'google-services.json');
  // EAS CLI evaluates app.config locally before its file variable exists. The
  // build worker evaluates it again with GOOGLE_SERVICES_JSON set to a real path.
  const androidConfig = process.env.GOOGLE_SERVICES_JSON ||
    (process.env.EAS_CLOUD_BUILD ? null : fs.existsSync(localConfig) ? localConfig : null);
  const androidReady = Boolean(androidConfig && fs.existsSync(androidConfig));
  if (process.env.EAS_BUILD === 'true') {
    const required = ['EXPO_PUBLIC_FIREBASE_API_KEY', 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'EXPO_PUBLIC_FIREBASE_APP_ID',
      'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'];
    const missing = required.filter(name => !process.env[name]);
    if (missing.length || !androidReady) {
      throw new Error(`Firebase build configuration is incomplete: ${[...missing, ...(!androidReady ? ['GOOGLE_SERVICES_JSON'] : [])].join(', ')}`);
    }
  }
  return {
    ...config,
    android: { ...config.android, ...(androidReady ? { googleServicesFile: androidConfig } : {}) },
    plugins: [...(config.plugins ?? []), ...(androidReady ? ['@react-native-google-signin/google-signin'] : [])],
  };
};
