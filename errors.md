# HealthPay Errors

## Sword error codes

### 4xxx (invalid app secret)

- `4001`: user is deactivated

### 2xxx (invalid app secret)

- `5006`: secret: app secret is invalid for OTP

### 2xxx (invalid authentication headers)

- `2001`: header: api-header is required
- `2002`: header: api-header is invalid
- `2004`: header: authorization is invalid
- `2009`: header: Api header or IP is invalid

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

---

## Fence error codes

### 2xxx (invalid user authentication headers)

- `2001`: header: authorization is invalid
- `2002`: user not found
- `2003`: user already exists
- `2009`: Api header or IP is invalid

### 9xxx (auction errors)

- `9001`: user already have active auctions
- `9001`: auction is full

### 79xx (bill payment)

- `7901`: invalid bill amount
- `7900` 'Bill payment service failed'
- `7900` 'transaction not found'
- `7901` 'bill amount is invalid '
- `7902` 'service list is empty'
- `7903` 'service not found'
- `7904` 'amount bracket not found'
- `7905` 'general error'
- `7911` 'provider or services doesnt exist'
- `7913` 'amount is required for non inquiry'
