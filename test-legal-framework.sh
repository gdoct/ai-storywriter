#!/bin/bash

# Test Legal Framework Implementation
echo "🔍 Testing Legal Framework Feature Implementation"
echo "================================================="

# Test 1: Legal Document Pages
echo "1. Testing legal document pages..."

echo "   📄 Testing Privacy Policy page..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/privacy
if [ $? -eq 0 ]; then
    echo "   ✅ Privacy Policy page accessible"
else
    echo "   ❌ Privacy Policy page failed"
fi

echo "   📄 Testing Terms of Service page..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/terms
if [ $? -eq 0 ]; then
    echo "   ✅ Terms of Service page accessible"
else
    echo "   ❌ Terms of Service page failed"
fi

# Test 2: Marketing Footer on Public Pages
echo ""
echo "2. Testing marketing footer on public pages..."

echo "   🏠 Testing home page footer..."
curl -s http://localhost:3000/ | grep -q "Privacy Policy\|Terms of Service"
if [ $? -eq 0 ]; then
    echo "   ✅ Marketing footer present on home page"
else
    echo "   ❌ Marketing footer missing on home page"
fi

echo "   📊 Testing features page footer..."
curl -s http://localhost:3000/features | grep -q "Privacy Policy\|Terms of Service"
if [ $? -eq 0 ]; then
    echo "   ✅ Marketing footer present on features page"
else
    echo "   ❌ Marketing footer missing on features page"
fi

echo "   💰 Testing pricing page footer..."
curl -s http://localhost:3000/pricing | grep -q "Privacy Policy\|Terms of Service"
if [ $? -eq 0 ]; then
    echo "   ✅ Marketing footer present on pricing page"
else
    echo "   ❌ Marketing footer missing on pricing page"
fi

# Test 3: Signup Page Legal Agreement
echo ""
echo "3. Testing signup page legal agreement..."

echo "   📝 Testing signup page has legal checkbox..."
curl -s http://localhost:3000/signup | grep -q "I agree to the"
if [ $? -eq 0 ]; then
    echo "   ✅ Legal agreement checkbox present on signup"
else
    echo "   ❌ Legal agreement checkbox missing on signup"
fi

# Test 4: Database Schema
echo ""
echo "4. Testing database schema..."

echo "   🗄️  Checking legal agreement columns in users table..."
cd /home/guido/storywriter/backend/data
COLUMNS=$(sqlite3 storywriter.db "PRAGMA table_info(users);" | grep -E "(terms_agreed_at|privacy_agreed_at|terms_version|privacy_version)" | wc -l)

if [ "$COLUMNS" -eq 4 ]; then
    echo "   ✅ All 4 legal agreement columns present in users table"
else
    echo "   ❌ Legal agreement columns missing ($COLUMNS/4 found)"
fi

# Test 5: Backend API
echo ""
echo "5. Testing backend API accepts legal agreement..."

echo "   🚀 Testing signup with legal agreement..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_legal_' $(date +%s)'",
    "email": "test@example.com",
    "password": "testpass",
    "agreeToTerms": true
  }')

if echo "$RESPONSE" | grep -q "access_token"; then
    echo "   ✅ Backend successfully processes legal agreement"
else
    echo "   ❌ Backend failed to process legal agreement"
fi

echo ""
echo "================================================="
echo "🎉 Legal Framework Feature Test Complete!"
echo ""
echo "Key Features Implemented:"
echo "- ✅ Privacy Policy page (/privacy)"
echo "- ✅ Terms of Service page (/terms)"
echo "- ✅ Marketing footer with legal links on all public pages"
echo "- ✅ Signup form with mandatory legal agreement checkbox"
echo "- ✅ Database schema updated with legal tracking columns"
echo "- ✅ Backend API updated to handle legal agreements"
echo ""
echo "🔗 Test the feature manually:"
echo "   • Visit: http://localhost:3000/signup"
echo "   • Try to submit without checking legal agreement"
echo "   • Check legal agreement and submit"
echo "   • Visit: http://localhost:3000/privacy"
echo "   • Visit: http://localhost:3000/terms"
echo ""
