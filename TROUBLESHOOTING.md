# Troubleshooting Vercel Deployment

## Quick Checks

### 1. Test Basic Function
Visit: `https://ujyalo-backend.vercel.app/test`
- Should return: `{"message": "Serverless function is working!", ...}`
- If this fails, the function isn't deploying correctly

### 2. Test Health Endpoint
Visit: `https://ujyalo-backend.vercel.app/api/health`
- Should return: `{"status": "ok", ...}`
- This doesn't require database connection

### 3. Check Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables:
- ✅ `MONGODB_URI` must be set
- ✅ `JWT_SECRET` should be set
- ✅ Other variables as needed

### 4. Check Function Logs
In Vercel Dashboard → Project → Functions tab:
- Look for error messages
- Check if requests are reaching the function
- Look for database connection errors

## Common Issues

### Issue: 500 Internal Server Error

**Possible Causes:**
1. **Missing MONGODB_URI**
   - Check Vercel environment variables
   - Verify the connection string is correct
   - Make sure MongoDB Atlas allows connections from Vercel IPs (or use `0.0.0.0/0`)

2. **Database Connection Timeout**
   - Check MongoDB Atlas network access
   - Verify connection string format
   - Check Vercel function logs for specific error

3. **Module Import Errors**
   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility

### Issue: CORS Errors

**Symptoms:**
- `Access-Control-Allow-Origin header is missing`
- `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solutions:**
1. Check the exact frontend URL in CORS configuration
2. Verify the origin matches exactly (including `https://` and no trailing slash)
3. Check Vercel function logs to see what origin is being sent

### Issue: 404 Not Found

**Possible Causes:**
1. **Wrong URL path**
   - Frontend should call: `https://ujyalo-backend.vercel.app/api/products`
   - Not: `https://ujyalo-backend.vercel.app/apiapi/products`

2. **vercel.json routing issue**
   - Check that `vercel.json` is in the root of the backend project
   - Verify the rewrite rules are correct

## Debugging Steps

1. **Check Function Logs:**
   ```
   Vercel Dashboard → Your Project → Functions → api/index.js → View Logs
   ```

2. **Test with curl:**
   ```bash
   curl https://ujyalo-backend.vercel.app/test
   curl https://ujyalo-backend.vercel.app/api/health
   ```

3. **Check Network Tab:**
   - Open browser DevTools → Network tab
   - Make a request from frontend
   - Check the request URL, headers, and response

4. **Verify Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Make sure variables are set for "Production" environment
   - Redeploy after adding/changing variables

## Testing Checklist

- [ ] `/test` endpoint works (no DB needed)
- [ ] `/api/health` endpoint works (no DB needed)
- [ ] `/api/products` endpoint works (requires DB)
- [ ] CORS headers are present in response
- [ ] Environment variables are set correctly
- [ ] MongoDB connection is working
- [ ] Function logs show no errors

## Still Not Working?

1. **Check Vercel Function Logs** - Most important!
2. **Verify MongoDB Connection** - Test connection string locally
3. **Check Frontend Environment** - Verify `environment.prod.ts` has correct URL
4. **Test Endpoints Directly** - Use curl or Postman to test backend independently
5. **Check Vercel Build Logs** - Make sure the build succeeded

