# HealthPay Login Page Fix Summary

## Date: December 20, 2025

## Issues Found and Fixed

### 1. Phone Number Format Mismatch ✅ FIXED
**Problem:**
- Frontend was sending phone numbers with `+20` prefix (e.g., `+201016464676`)
- Backend database stores phone numbers without `+` sign (e.g., `201016464676`)
- This caused OTP verification to fail with "رمز التحقق غير صحيح" error

**Solution:**
- Updated `formatPhone()` function in `/var/www/html/index.html`
- Changed from: `return '+20' + cleaned;`
- Changed to: `return '20' + cleaned;`

### 2. Invalid GraphQL Field in sendOTP Mutation ✅ FIXED
**Problem:**
- Frontend was requesting `otpId` field which doesn't exist in `OTPResponse` type
- This caused sendOTP mutation to fail silently

**Solution:**
- Removed `otpId` field from sendOTP mutation query
- Updated mutation to only request `success` and `message` fields

### 3. Nginx Configuration Issue ✅ FIXED
**Problem:**
- Root path `/` was being proxied to Next.js app (localhost:3001)
- The login HTML file was never being served
- Browser was loading Next.js app instead of the login page

**Solution:**
- Updated `/etc/nginx/sites-available/healthpay-frontends`
- Added exact match for root path: `location = / { ... }`
- Configured it to serve `/var/www/html/index.html` before proxying to Next.js
- Moved Next.js proxy to catch-all location at the end

### 4. File Permissions Issue ✅ FIXED
**Problem:**
- `/var/www/html/index.html` had restrictive permissions (600)
- Nginx couldn't read the file

**Solution:**
- Changed permissions to 644: `chmod 644 /var/www/html/index.html`

## Verification Tests

### Test 1: sendOTP Mutation
```bash
curl -X POST http://104.248.245.150:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { sendOTP(input: {phoneNumber: \"201016464676\", purpose: LOGIN}) { success message } }"}'
```

**Result:** ✅ SUCCESS
```json
{"data":{"sendOTP":{"success":true,"message":"تم إرسال رمز التحقق"}}}
```

### Test 2: verifyOTP Mutation
```bash
curl -X POST http://104.248.245.150:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { verifyOTP(input: {phoneNumber: \"201016464676\", code: \"961912\", purpose: LOGIN}) { accessToken refreshToken expiresAt user { id phoneNumber fullName } } }"}'
```

**Result:** ✅ SUCCESS
```json
{
  "data": {
    "verifyOTP": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresAt": "2025-12-27T00:19:48.220Z",
      "user": {
        "id": "241fd179-9822-4a9a-8df7-2d1c0fa38375",
        "phoneNumber": "201016464676",
        "fullName": "مستخدم جديد"
      }
    }
  }
}
```

### Test 3: HTML File Serving
```bash
curl -s http://104.248.245.150/ | grep -A 3 "function formatPhone"
```

**Result:** ✅ CORRECT
```javascript
function formatPhone(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.startsWith('20')) cleaned = cleaned.substring(2);
    return '20' + cleaned;  // ✅ FIXED: No + sign to match backend format
}
```

## Files Modified

1. **`/var/www/html/index.html`** (formerly login.html)
   - Fixed formatPhone function
   - Removed otpId field from sendOTP mutation
   - Set permissions to 644

2. **`/etc/nginx/sites-available/healthpay-frontends`**
   - Added exact match for root path
   - Configured to serve index.html before proxying
   - Added cache-control headers for HTML files

## Current Status

✅ **All issues resolved**
✅ **Login flow working via API**
✅ **HTML file being served correctly**
✅ **Phone number format matching backend**

## Next Steps for User

1. Clear browser cache (Ctrl+Shift+Delete)
2. Visit http://104.248.245.150/
3. Enter phone number: 01016464676
4. Click "إرسال رمز التحقق" (Send OTP)
5. Enter the OTP code received
6. Click "تأكيد" (Verify)
7. Should successfully log in and redirect to dashboard

## Technical Notes

- OTP codes expire after 5 minutes
- Phone numbers are stored in format: `201016464676` (no + sign)
- Frontend now correctly formats phone numbers to match backend
- Nginx serves HTML file at root path, Next.js app is at `/dashboard`, `/admin`, `/merchant`

## Backup Files

- `/var/www/html/login-old-backup.html` - Original file with bugs
- `/var/www/html/login-new.html` - Intermediate version
- `/var/www/html/index-old.html` - Previous index file
