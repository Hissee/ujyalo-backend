# Vercel Deployment Guide

This guide explains how to deploy the UjyaloKhet backend to Vercel.

## Changes Made for Vercel Compatibility

1. **Created `api/index.js`**: Serverless function entry point that exports the Express app
2. **Created `vercel.json`**: Vercel configuration for routing
3. **Updated `db.js`**: Improved connection handling for serverless environments with connection reuse
4. **Lazy Initialization**: Database and admin initialization now happens on first request, not at startup

## Required Environment Variables

Make sure to set these in your Vercel project settings:

1. **MONGODB_URI** - Your MongoDB connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/ujyaloDB?retryWrites=true&w=majority`

2. **JWT_SECRET** - Secret key for JWT token generation
   - Example: A long random string

3. **ADMIN_EMAIL** (Optional) - Default admin email
   - Default: `admin@ujyalokhet.com`

4. **ADMIN_PASSWORD** (Optional) - Default admin password
   - Default: `Admin@123`
   - ⚠️ **Change this in production!**

5. **CLOUDINARY_URL** or individual Cloudinary credentials:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

6. **Email Service Variables** (if using email features):
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASS`

## Deployment Steps

1. **Push to GitHub**: Make sure all changes are committed and pushed
2. **Connect to Vercel**: 
   - Go to Vercel dashboard
   - Import your GitHub repository
   - Select the `ujyalo-backend` folder as the root directory
3. **Set Environment Variables**: Add all required environment variables in Vercel project settings
4. **Deploy**: Vercel will automatically build and deploy

## Testing the Deployment

After deployment, test these endpoints:

- `https://your-backend.vercel.app/api/health` - Should return `{"status":"ok"}`
- `https://your-backend.vercel.app/api/products` - Should return products list

## Troubleshooting

### 500 Internal Server Error

1. **Check Vercel Function Logs**: 
   - Go to your Vercel project → Functions tab
   - Check the logs for specific error messages

2. **Verify Environment Variables**:
   - Make sure `MONGODB_URI` is set correctly
   - Check that all required variables are present

3. **Database Connection Issues**:
   - Verify your MongoDB Atlas IP whitelist includes Vercel's IPs (or use `0.0.0.0/0` for all)
   - Check that your MongoDB connection string is correct

4. **Cold Start Issues**:
   - First request after inactivity may take longer (cold start)
   - Subsequent requests should be faster

## Local Development

For local development, continue using `server.js`:

```bash
npm run dev
```

The `api/index.js` file is only used for Vercel deployment.

## Notes

- The serverless function uses lazy initialization to avoid cold start issues
- Database connections are reused across function invocations
- Admin user initialization is idempotent (safe to run multiple times)

