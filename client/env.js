const ENV = {
    development: {
      API_URL: 'http://192.168.1.184:8000',
      // API_URL: 'http://192.168.0.4:8000',
    },
    production: {
      API_URL: 'https://fitness-web-app-cgaffcezeehkdmc4.uksouth-01.azurewebsites.net',
    },
};
  
const getEnvVars = (env = process.env.NODE_ENV) => {
    // Return the corresponding environment variables
    if (!env || !ENV[env]) {
      return ENV.development; // Default to development if no environment is specified
    }
    return ENV[env];
};
  
export default getEnvVars();
  