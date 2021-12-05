# HealthPay Errors

## Sword error codes

### 2xxx (invalid authentication headers)

- `2001`: header: api-header is required
- `2002`: header: api-header is invalid
- `2004`: header: authorization is invalid

### 3xxx (invalid authentication params)

- `3001`: param: apiKey is invalid
- `3002`: param: userToken is invalid

### 5xxx (invalid operation)

- `5001`: too many login otp sent. Please wait for 1 hour before sending more login otps
- `5002`: invalid user otp.

### 6xxx (unprocessed operation)

- `6001`: payment gateway unprocessed operation, Please try again

### 7xxx (invalid wallet operations)

- `7001`: insufficient funds in payer wallet

------------------------------------------------------

## Fence error codes

### 2xxx (invalid user authentication headers)

- `2001`: header: authorization is invalid
- `2002`: user not found
- `2003`: user already exists
