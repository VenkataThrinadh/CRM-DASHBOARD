// Environment configuration for CRM Dashboard
const ENV = process.env.NODE_ENV || 'production';

// Use environment variables if available, otherwise fall back to defaults
const getEnvVar = (key, fallback) => {
  return process.env[key] || fallback;
};

// Detect if we're running locally or on the live server
const isLocalDevelopment = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// Get base URLs based on current environment and location
const getBaseUrls = () => {
  if (ENV === 'development' && isLocalDevelopment()) {
    // Local development - connect to local backend server
    return {
      apiBaseUrl: getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:3000/backend/api'),
      serverBaseUrl: getEnvVar('REACT_APP_SERVER_BASE_URL', 'http://localhost:3000/backend'),
      imageBaseUrl: getEnvVar('REACT_APP_IMAGE_BASE_URL', 'http://localhost:3000/backend'),
    };
  } else {
    // Production or development served from live server - use relative paths
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    
    return {
      apiBaseUrl: getEnvVar('REACT_APP_API_BASE_URL', `${baseUrl}/backend/api`),
      serverBaseUrl: getEnvVar('REACT_APP_SERVER_BASE_URL', `${baseUrl}/backend`),
      imageBaseUrl: getEnvVar('REACT_APP_IMAGE_BASE_URL', `${baseUrl}/backend`),
    };
  }
};

const config = {
  development: getBaseUrls(),
  production: getBaseUrls()
};

// Export the configuration for the current environment
export default config[ENV];

// Helper functions
export const getApiBaseUrl = () => config[ENV].apiBaseUrl;
export const getServerBaseUrl = () => config[ENV].serverBaseUrl;
export const getImageBaseUrl = () => config[ENV].imageBaseUrl;
export const isDevelopment = () => ENV === 'development';
export const isProduction = () => ENV === 'production';