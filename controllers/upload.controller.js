import cloudinary from '../config/cloudinary.config.js';
import multer from 'multer';
import { getDB } from '../db.js';

// Upload single image to Cloudinary
export const uploadImage = async (req, res) => {
  try {
    console.log('Upload single image - Request received');
    console.log('File:', req.file ? 'Present' : 'Missing');
    console.log('File buffer:', req.file?.buffer ? `Size: ${req.file.buffer.length} bytes` : 'No buffer');
    
    if (!req.file) {
      console.error('No file provided in request');
      return res.status(400).json({ message: 'No image file provided' });
    }

    if (!req.file.buffer) {
      console.error('File buffer is missing');
      return res.status(400).json({ message: 'File buffer is missing' });
    }

    console.log('Uploading to Cloudinary...');
    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ujyalo-khet/products', // Organize images in a folder
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload stream error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload successful:', result.public_id);
            resolve(result);
          }
        }
      );

      // Write buffer to upload stream
      uploadStream.end(req.file.buffer);
    });

    console.log('Upload complete, returning response');
    res.status(200).json({
      message: 'Image uploaded successfully',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    console.error('Error stack:', error.stack);
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({
      message: 'Failed to upload image',
      error: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Upload multiple images to Cloudinary
export const uploadImages = async (req, res) => {
  try {
    console.log('Upload multiple images - Request received');
    console.log('Files:', req.files ? `${req.files.length} files` : 'Missing');
    
    if (!req.files || req.files.length === 0) {
      console.error('No files provided in request');
      return res.status(400).json({ message: 'No image files provided' });
    }

    console.log(`Uploading ${req.files.length} files to Cloudinary...`);
    const uploadPromises = req.files.map((file, index) => {
      return new Promise((resolve, reject) => {
        if (!file.buffer) {
          console.error(`File ${index} buffer is missing`);
          reject(new Error(`File ${index} buffer is missing`));
          return;
        }
        
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'ujyalo-khet/products',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              console.error(`Cloudinary upload error for file ${index}:`, error);
              reject(error);
            } else {
              console.log(`File ${index} uploaded successfully:`, result.public_id);
              resolve(result);
            }
          }
        );

        uploadStream.end(file.buffer);
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    const imageUrls = uploadResults.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }));

    console.log('All uploads complete, returning response');
    res.status(200).json({
      message: 'Images uploaded successfully',
      images: imageUrls,
      count: imageUrls.length,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    console.error('Error stack:', error.stack);
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
      }
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({
      message: 'Failed to upload images',
      error: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete image from Cloudinary
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        message: 'Image deleted successfully',
        publicId: publicId,
      });
    } else {
      res.status(404).json({
        message: 'Image not found or already deleted',
        publicId: publicId,
      });
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({
      message: 'Failed to delete image',
      error: error.message,
    });
  }
};

