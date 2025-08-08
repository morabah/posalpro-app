#!/bin/bash

echo "=== Testing Profile Update with CURL ==="

# Step 1: Get CSRF token
echo "1. Getting CSRF token..."
CSRF_RESPONSE=$(curl -s -c /tmp/cookies.txt http://localhost:3000/api/auth/csrf)
echo "CSRF Response: $CSRF_RESPONSE"

CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: $CSRF_TOKEN"

if [ -z "$CSRF_TOKEN" ]; then
  echo "❌ Failed to get CSRF token"
  exit 1
fi

# Step 2: Authenticate
echo "2. Authenticating..."
AUTH_RESPONSE=$(curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@posalpro.com&password=ProposalPro2024%21&csrfToken=$CSRF_TOKEN&callbackUrl=http://localhost:3000/admin&json=true" \
  http://localhost:3000/api/auth/callback/credentials)

echo "Auth response length: ${#AUTH_RESPONSE}"

# Step 3: Test profile GET
echo "3. Testing profile GET..."
PROFILE_GET=$(curl -s -b /tmp/cookies.txt -w "HTTP_STATUS:%{http_code}" http://localhost:3000/api/profile)
echo "Profile GET response: $PROFILE_GET"

# Step 4: Test profile UPDATE
echo "4. Testing profile UPDATE..."
UPDATE_DATA='{"firstName":"System","lastName":"Administrator","email":"admin@posalpro.com","department":"Business Development","title":"Chief Technology Officer","phone":"+1-555-0123","bio":"Updated via curl test at '$(date)'"}'

UPDATE_RESPONSE=$(curl -s -b /tmp/cookies.txt -X PUT \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA" \
  -w "HTTP_STATUS:%{http_code}" \
  http://localhost:3000/api/profile/update)

echo "Update response: $UPDATE_RESPONSE"

# Step 5: Verify update
echo "5. Verifying update..."
VERIFY_RESPONSE=$(curl -s -b /tmp/cookies.txt -w "HTTP_STATUS:%{http_code}" http://localhost:3000/api/profile)
echo "Verification response: $VERIFY_RESPONSE"

# Cleanup
rm -f /tmp/cookies.txt

echo "=== CURL TEST COMPLETE ==="
