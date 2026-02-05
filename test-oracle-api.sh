#!/bin/bash
# Oracle API Test Script
# Tests all 3 tiers with actual API calls

echo "🧪 Testing Oracle AI - 3 Tier System"
echo "======================================"
echo ""

# You need to replace this with a real JWT token from your logged-in session
# Get it from: Browser DevTools > Application > Cookies > token
# Or from the response of POST /api/v1/auth/login

JWT_TOKEN="YOUR_JWT_TOKEN_HERE"
API_URL="http://localhost:3001/api/v1"

# Test if server is running
echo "📡 Checking server status..."
curl -s $API_URL/health -o /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not responding"
    exit 1
fi

echo ""
echo "================================"
echo "TIER 1: Pattern Matching (Free)"
echo "================================"
echo "Query: 'how many contracts'"
echo ""

curl -X POST $API_URL/oracle/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"query": "how many contracts"}' \
  2>/dev/null | jq '.'

echo ""
echo "================================"
echo "TIER 2: AI Function Calling ($0.001)"
echo "================================"
echo "Query: 'show me all active contracts'"
echo ""

curl -X POST $API_URL/oracle/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"query": "show me all active contracts"}' \
  2>/dev/null | jq '.'

echo ""
echo "================================"
echo "TIER 3: Conversational AI ($0.02)"
echo "================================"
echo "Query: 'what should I include in an NDA?'"
echo ""

curl -X POST $API_URL/oracle/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"query": "what should I include in an NDA?"}' \
  2>/dev/null | jq '.'

echo ""
echo "================================"
echo "Check Rate Limits"
echo "================================"

curl -X GET $API_URL/oracle/usage \
  -H "Authorization: Bearer $JWT_TOKEN" \
  2>/dev/null | jq '.'

echo ""
echo "✅ Tests complete!"
