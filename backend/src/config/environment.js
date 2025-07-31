// backend/src/config/environment.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Please check your .env file configuration');
}

// Export all environment variables
module.exports = process.env;