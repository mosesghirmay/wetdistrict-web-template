#!/bin/bash
echo "🧹 Clearing cache..."
rm -rf node_modules/.cache
rm -rf build
rm -rf .next

echo "🔍 Checking port 3000..."
lsof -i :3000 | grep LISTEN
if [ $? -eq 0 ]; then
  echo "🚫 Port 3000 is in use. Killing process..."
  lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
  echo "✅ Process killed."
fi

echo "🔍 Checking port 3500..."
lsof -i :3500 | grep LISTEN
if [ $? -eq 0 ]; then
  echo "🚫 Port 3500 is in use. Killing process..."
  lsof -i :3500 | grep LISTEN | awk '{print $2}' | xargs kill -9
  echo "✅ Process killed."
fi

echo ""
echo "🔑 DEVELOPMENT MODE ACTIVATED WITH EXPLICIT PORT 3000"
echo ""
echo "💡 HOW TO USE:"
echo "1. Go to http://localhost:3000/login"
echo "2. Enter any email and password"
echo "3. You will be automatically redirected to the homepage"
echo ""
echo "🚀 Starting development server on port 3000..."
REACT_APP_BYPASS_AUTH=true REACT_APP_DEV_API_SERVER_PORT=3000 yarn dev