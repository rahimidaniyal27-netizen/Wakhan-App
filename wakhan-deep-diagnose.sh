#!/bin/bash
# Wakhan Deep Diagnostic Script
# Run on Hetzner server

echo "=========================================="
echo "  WAKHAN DEEP DIAGNOSTIC"
echo "=========================================="
echo ""

SERVER_IP="2.31.72.140"
PORT="8000"

# 1. Check if backend is running
echo "[1] Backend Process Check..."
ps aux | grep -E "node|PM2" | grep -v grep
echo ""

# 2. Check PM2 status
echo "[2] PM2 Status..."
pm2 list 2>/dev/null || echo "PM2 not installed or no processes"
echo ""

# 3. Check port binding
echo "[3] Port Binding..."
netstat -tlnp 2>/dev/null | grep :8000 || ss -tlnp | grep :8000
echo ""

# 4. Check firewall
echo "[4] Firewall Status..."
ufw status 2>/dev/null || echo "UFF not active"
iptables -L -n 2>/dev/null | grep -E "8000|DROP|REJECT" | head -10
echo ""

# 5. Test API endpoints from server itself
echo "[5] API Test from Server (localhost)..."
for endpoint in \
  "http://localhost:8000/api/health" \
  "http://localhost:8000/api/me" \
  "http://localhost:8000/api/search?k=m&q=test"; do
  echo "  Testing: $endpoint"
  curl -s -o /dev/null -w "    Status: %{http_code}, Time: %{time_total}s\n" "$endpoint" 2>&1
done
echo ""

# 6. Test from public IP (external)
echo "[6] API Test from Public IP..."
for endpoint in \
  "http://${SERVER_IP}:8000/api/health" \
  "http://${SERVER_IP}:8000/api/me"; do
  echo "  Testing: $endpoint"
  curl -s -o /dev/null -w "    Status: %{http_code}, Time: %{time_total}s\n" "$endpoint" 2>&1
done
echo ""

# 7. Check DNS
echo "[7] DNS Resolution..."
dig +short ${SERVER_IP} 2>/dev/null || nslookup ${SERVER_IP} 2>/dev/null | tail -3
echo ""

# 8. Check if port is reachable from internet
echo "[8] External Port Check..."
timeout 5 bash -c "echo > /dev/tcp/${SERVER_IP}/8000" 2>&1 && echo "  Port 8000 is OPEN" || echo "  Port 8000 is CLOSED/FILTERED"
echo ""

# 9. Use tcpdump to monitor traffic (15 seconds) - does NOT block port
echo "[9] Monitoring network traffic for 15 seconds..."
echo "    >> OPEN WAKHAN APP ON IPHONE NOW <<"
echo ""

# Check if tcpdump is available
if command -v tcpdump &> /dev/null; then
    echo "    Using tcpdump to capture traffic on port 8000..."
    timeout 15 tcpdump -i any port 8000 -n -q 2>&1 | tee /tmp/tcpdump.log
    
    echo ""
    echo "    Results:"
    if grep -q "${SERVER_IP}.8000" /tmp/tcpdump.log 2>/dev/null; then
        echo "    TRAFFIC SEEN! Requests are reaching the server."
        grep "${SERVER_IP}.8000" /tmp/tcpdump.log | head -5
    else
        echo "    NO TRAFFIC on port 8000 from any IP!"
        echo "    This means the iPhone app is NOT reaching this server at all."
        echo ""
        echo "    Possible causes:"
        echo "      - Wrong URL embedded in app (check wakhan-shell.json)"
        echo "      - App Transport Security (ATS) blocking HTTP"
        echo "      - DNS not resolving"
        echo "      - iPhone using cached/stale connection"
        echo "      - Proxy/VPN on iPhone"
        echo "      - iPhone connected to WiFi with firewall"
    fi
else
    echo "    tcpdump not available. Installing..."
    apt-get update -qq && apt-get install -y -qq tcpdump 2>/dev/null
    
    if command -v tcpdump &> /dev/null; then
        echo "    Now running tcpdump for 15 seconds..."
        timeout 15 tcpdump -i any port 8000 -n -q 2>&1 | tee /tmp/tcpdump.log
        
        if grep -q "${SERVER_IP}.8000" /tmp/tcpdump.log 2>/dev/null; then
            echo "    TRAFFIC SEEN!"
        else
            echo "    NO TRAFFIC on port 8000!"
        fi
    else
        echo "    Could not install tcpdump. Trying alternative..."
        
        # Alternative: use netstat while app runs
        echo "    Monitoring netstat for 15 seconds..."
        for i in {1..15}; do
            netstat -an 2>/dev/null | grep ":8000" | grep ESTABLISHED
            sleep 1
        done
    fi
fi

echo ""
echo "[10] Final Checks..."

# Check if server responds to OPTIONS (preflight)
echo "  OPTIONS /api/health:"
curl -s -X OPTIONS -o /dev/null -w "    Status: %{http_code}\n" "http://${SERVER_IP}:8000/api/health" 2>&1

# Check headers
echo "  Response headers:"
curl -sI "http://${SERVER_IP}:8000/api/health" 2>&1 | grep -iE "access-control|content-type|server"

echo ""
echo "=========================================="
echo "  DIAGNOSTIC COMPLETE"
echo "=========================================="
