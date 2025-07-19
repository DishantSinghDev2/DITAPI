#!/bin/bash

# DITAPI Gateway Startup Script

set -e

echo "🚀 Starting DITAPI Gateway..."

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    exit 1
fi

# Check database connectivity
echo "🔍 Checking database connectivity..."
node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT 1\`.then(() => {
    console.log('✅ Database connection successful');
}).catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
});
"

# Start the gateway
echo "Starting DITAPI Gateway (conceptual standalone server)..."
# This command would start the compiled Node.js gateway server
# exec node dist/server.js

echo "For Next.js integration, ensure your Next.js app is running."
echo "The gateway logic is handled by app/api/gateway/[...path]/route.ts within the Next.js application."
echo "To start the Next.js application, run 'npm run dev' or 'npm start' in the root directory."
