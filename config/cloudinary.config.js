import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
// Support both CLOUDINARY_URL and individual credentials
if (process.env.CLOUDINARY_URL) {
  // Use CLOUDINARY_URL if provided (format: cloudinary://api_key:api_secret@cloud_name)
  cloudinary.config();
} else {
  // Use individual credentials
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dhxru6nue',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET || 'sQVv_GBuEP5fiqPDSAJkx_iEQvU',
  });
}

export default cloudinary;

