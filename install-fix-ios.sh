#!/usr/bin/env bash
set -euo pipefail
echo "=== Wakhan Backend Fix ==="
echo ""

# Update auth middleware
echo "[1/2] Updating auth middleware..."
curl -sL https://raw.githubusercontent.com/rahimidaniyal27-netizen/Wakhan-App/main/backend/middleware/auth.js -o /var/www/wakhan-app/backend/middleware/auth.js
echo "Done"

# Restart backend
echo "[2/2] Restarting backend..."
pm2 restart wakhan-api 2>&1 | tail -3
echo "Done"

echo ""
echo "=== Fix complete ==="
echo ""
echo "Now test the app on iPhone!"
