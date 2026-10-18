const baseConfig = require('./app.base.json');

const ENVIRONMENTS = new Set(['development', 'qa', 'production']);
const DEFAULT_PRODUCTION_API = 'https://api-clinica-jx4m.onrender.com/api/v1';
const ENVIRONMENT_ICONS = {
  qa: './assets/ineo-icon-qa.png',
  production: './assets/ineo-icon-production.png',
};

function resolveEnvironment() {
  const environment = process.env.APP_ENV || 'production';
  if (!ENVIRONMENTS.has(environment)) {
    throw new Error(`APP_ENV inválido: ${environment}`);
  }
  return environment;
}

function resolveApiUrl(environment) {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL
    || (environment === 'production' ? DEFAULT_PRODUCTION_API : '');

  if (!configuredUrl) {
    throw new Error('EXPO_PUBLIC_API_URL es obligatorio para development y qa');
  }

  const url = new URL(configuredUrl);
  const isSecure = url.protocol === 'https:';
  const isDevelopmentHttp = environment === 'development' && url.protocol === 'http:';

  if (!isSecure && !isDevelopmentHttp) {
    throw new Error('La API de QA y producción debe usar HTTPS');
  }

  return configuredUrl.replace(/\/$/, '');
}

module.exports = () => {
  const environment = resolveEnvironment();
  const apiUrl = resolveApiUrl(environment);
  const environmentIcon = ENVIRONMENT_ICONS[environment];
  const selectedIcon = environmentIcon || baseConfig.expo.icon;
  const baseAdaptiveIcon = baseConfig.expo.android?.adaptiveIcon || {};
  const adaptiveIcon = environmentIcon
    ? {
        ...baseAdaptiveIcon,
        foregroundImage: environmentIcon,
        backgroundColor: '#02194D',
      }
    : baseAdaptiveIcon;
  const android = {
    ...baseConfig.expo.android,
    adaptiveIcon,
  };

  return {
    ...baseConfig.expo,
    name: environment === 'production'
      ? baseConfig.expo.name
      : `${baseConfig.expo.name} ${environment.toUpperCase()}`,
    slug: baseConfig.expo.slug,
    icon: selectedIcon,
    android,
    extra: {
      ...baseConfig.expo.extra,
      APP_ENV: environment,
      API_URL: apiUrl,
    },
  };
};

module.exports.resolveEnvironment = resolveEnvironment;
module.exports.resolveApiUrl = resolveApiUrl;
