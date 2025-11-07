import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
// Support both CLOUDINARY_URL and individual credentials
if (process.env.CLOUDINARY_URL) {
  // Use CLOUDINARY_URL if provided (format: cloudinary://api_key:api_secret@cloud_name)
  cloudinary.config();
  console.log('Cloudinary configured using CLOUDINARY_URL');
} else {
  // Use individual credentials
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dhxru6nue',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
  
  // Validate that we have required credentials
  if (!config.api_key || !config.api_secret) {
    console.error('Warning: Cloudinary API key or secret is missing. Uploads may fail.');
  } else {
    console.log('Cloudinary configured with individual credentials');
    console.log('Cloud name:', config.cloud_name);
    console.log('API Key:', config.api_key ? 'Set' : 'Missing');
    console.log('API Secret:', config.api_secret ? 'Set' : 'Missing');
  }
  
  cloudinary.config(config);
}

export default cloudinary;

