import express from 'express';
import multer from 'multer';
import { uploadImage, uploadImages, deleteImage } from '../controllers/upload.controller.js';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.middleware.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Error handling middleware for multer errors (must have 4 parameters)
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    // Handle file filter errors
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: err.message || 'Upload error occurred' });
  }
  next();
};

// Wrapper to handle multer errors properly
const handleUpload = (uploadMiddleware, controller) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      // If no error, proceed to controller
      // Controller is async, so we need to handle it properly
      Promise.resolve(controller(req, res, next)).catch((error) => {
        console.error('Controller error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        if (!res.headersSent) {
          res.status(500).json({
            message: 'Failed to upload images',
            error: error.message || 'Unknown error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        }
      });
    });
  };
};

// Upload single image (requires authentication)
router.post('/single', verifyToken, handleUpload(uploadSingle, uploadImage));

// Upload multiple images (requires authentication)
router.post('/multiple', verifyToken, handleUpload(uploadMultiple, uploadImages));

// Delete image (requires authentication)
router.delete('/:publicId', verifyToken, deleteImage);

export default router;

