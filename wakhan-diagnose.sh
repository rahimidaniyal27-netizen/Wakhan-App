#!/usr/bin/env bash
set -uo pipefail

echo "========================================"
echo "   Wakhan Backend Diagnostic Tool"
echo "========================================"
echo ""

# 1. Check if backend is running
echo "[1] Checking backend process..."
pm2 status wakhan-api 2>/dev/null | grep -E "name|status|wakhan-api" || echo "PM2 not found, checking manually..."
ps aux | grep -v grep | grep "node.*server.js" | head -2
echo ""

# 2. Check if backend is listening on port 8000
echo "[2] Checking port 8000..."
ss -tlnp | grep 8000 || netstat -tlnp 2>/dev/null | grep 8000 || echo "Port 8000 not listening!"
echo ""

# 3. Check backend logs for recent errors
echo "[3] Checking backend logs (last 20 lines)..."
pm2 logs wakhan-api --lines 20 --nostream 2>/dev/null | tail -20 || echo "No PM2 logs available"
echo ""

# 4. Test exact endpoints the frontend uses
echo "[4] Testing API endpoints..."
echo ""

# Test with no headers
echo -n "  GET /api/app/me (no auth): "
curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8000/api/app/me 2>&1
echo ""

# Test with Bearer token
echo -n "  GET /api/app/me (Bearer fake): "
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer fake_token" --max-time 5 http://localhost:8000/api/app/me 2>&1
echo ""

# Test with wka1 token
echo -n "  GET /api/app/me (wka1 fake): "
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: wka1 fake_token" --max-time 5 http://localhost:8000/api/app/me 2>&1
echo ""

# Test username endpoint
echo -n "  GET /api/app/username?u=test: "
curl -s --max-time 5 http://localhost:8000/api/app/username?u=test 2>&1 | head -c 80
echo ""

# Test health
echo -n "  GET /api/health: "
curl -s --max-time 5 http://localhost:8000/api/health 2>&1 | head -c 80
echo ""

# Test CORS with Capacitor origin
echo -n "  GET /api/health (CORS test): "
curl -s -o /dev/null -w "%{http_code}" -H "Origin: capacitor://localhost" --max-time 5 http://localhost:8000/api/health 2>&1
echo ""

echo ""

# 5. Monitor live traffic for 10 seconds
echo "[5] Monitoring live traffic for 10 seconds..."
echo "  >> Try to open the Wakhan app on your iPhone now <<"
echo "  (Watching for incoming requests...)"
echo ""

# Create a temporary log file
LOGFILE=/tmp/wakhan-$(date +%s).log
tail -n 0 -f /var/log/nginx/access.log > "$LOGFILE" 2>/dev/null &
NGINX_PID=$!

# Also try PM2 logs
pm2 logs wakhan-api --lines 0 --nostream > /tmp/pm2-monitor.log 2>&1 &
PM2_PID=$!

sleep 10

kill $NGINX_PID 2>/dev/null
kill $PM2_PID 2>/dev/null

# Check if any requests came in
echo "  Nginx requests during test:"
if [ -s "$LOGFILE" ]; then
    cat "$LOGFILE" | grep -v "^$" | tail -5
else
    echo "  (No requests seen in nginx logs)"
fi
rm -f "$LOGFILE"

echo ""
echo "[6] Checking CORS headers..."
curl -s -I -H "Origin: capacitor://localhost" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  --max-time 5 \
  http://localhost:8000/api/app/me 2>&1 | grep -i "access-control" || echo "  (No CORS headers)"

echo ""
echo "========================================"
echo "   Diagnostic Complete"
echo "========================================"
echo ""
echo "If you see NO requests in step 5:"
echo "  - The app isn't reaching the server"
echo "  - Check: Is the iPhone on the same network?"
echo "  - Check: Is the server IP correct?"
echo ""
echo "If you see requests but 401:"
echo "  - Auth is working, just needs login"
echo ""
echo "If you see requests but 404:"
echo "  - Route not found - backend needs fix"
echo ""
echo "If you see requests but 500:"
echo "  - Server error - check logs"
echo ""
