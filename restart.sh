#!/bin/bash
echo "🧹 Clearing cache..."
rm -rf node_modules/.cache
rm -rf .next

echo "🔄 Clearing browser storage..."
echo "  ⚠️ Remember to also clear your browser cache and cookies\!"
echo "  ⚠️ In Chrome, use Ctrl+Shift+Delete or go to Dev Tools > Application > Clear storage"

echo "🔍 Checking port 3000..."
lsof -i :3000 | grep LISTEN
if [ $? -eq 0 ]; then
  echo "🚫 Port 3000 is in use. Killing process..."
  lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
  echo "✅ Process killed."
fi

echo ""
echo "🔑 DEVELOPMENT MODE ACTIVATED"
echo ""
echo "💡 HOW TO USE:"
echo "1. Go to http://localhost:3000/login"
echo "2. Enter any email and password"
echo "3. You will be automatically redirected to the homepage"
echo ""
echo "🔧 Creating setupProxy.js for development server..."
cat > src/setupProxy.js << 'EOL'
/**
 * This file is used by create-react-app's development server
 * to proxy API requests to the correct backend routes
 */

// Configure environment variables
require('../server/env').configureEnv();

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { deserialize } = require('../server/api-util/sdk');
const passport = require('passport');

// Import API endpoints
const apiRouter = require('../server/apiRouter');

module.exports = function(app) {
  console.log('🚀 Setting up API proxy middleware');
  
  // Add cookie parser middleware
  app.use(cookieParser());
  
  // Parse Transit body first to a string
  app.use(
    '/api',
    bodyParser.text({
      type: 'application/transit+json',
    })
  );

  // Deserialize Transit body string to JS data
  app.use('/api', (req, res, next) => {
    if (req.get('Content-Type') === 'application/transit+json' && typeof req.body === 'string') {
      try {
        req.body = deserialize(req.body);
      } catch (e) {
        console.error('Failed to parse request body as Transit:');
        console.error(e);
        res.status(400).send('Invalid Transit in request body.');
        return;
      }
    }
    next();
  });

  // Initialize Passport.js
  app.use(passport.initialize());

  // Log all API requests for debugging
  app.use('/api', (req, res, next) => {
    console.log(`🔄 API Request: ${req.method} ${req.url}`);
    const originalSend = res.send;
    res.send = function(data) {
      console.log(`📤 API Response: ${res.statusCode} for ${req.method} ${req.url}`);
      return originalSend.call(this, data);
    };
    next();
  });

  // Use the API router for all /api requests
  app.use('/api', apiRouter);

  console.log('✅ API routes registered in development proxy');
};
EOL

echo "🚀 Starting development server on port 3000..."
REACT_APP_BYPASS_AUTH=true yarn dev
