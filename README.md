# Healthpay Monorepo

A comprehensive financial technology platform for healthcare payments, built with NestJS and TypeScript.

## Overview

Healthpay is a digital wallet and payment platform designed for the healthcare industry. It enables:
- **Merchants**: Healthcare providers to accept payments and manage transactions
- **Users**: Patients to manage their healthcare spending through digital wallets
- **Providers**: Service providers to receive payments for their services

## API Architecture

The API consists of two major steps for authenticating the merchant itself and the merchant's users/providers.

### Definitions

- **merchant**: Platforms that consume Healthpay APIs, with their own providers and/or users
- **provider**: A person providing a service/product at the merchant's platform (user with extra permissions)
- **user**: The platform's end-user who uses their wallet to pay for services
- **api-header, apiKey, token, userToken**: Authentication keys for various levels of access

### Permissions

#### Merchant
- Create/authenticate both users and providers
- Deduct `amount` from authenticated users and/or providers
- Add `amount` to authenticated users and/or providers

#### Users/Providers
- View total wallet balance
- View the last 10 logs
- Recharge wallet using designated recharging methods

## Project Structure

This is a **monorepo** containing multiple applications and shared libraries:

### Applications (`apps/`)

| Application | Description | Port |
|-------------|-------------|------|
| `hp-fence` | User-facing API (GraphQL) | 3000 |
| `hp-sword` | Merchant API Gateway | 3001 |
| `hp-financing` | Financing service | 3002 |
| `hp-nodejs` | Utility service | 3003 |

### Libraries (`libs/`)

| Library | Description |
|---------|-------------|
| `prisma` | Database ORM and schema |
| `services` | Shared business logic |
| `helpers` | Utility functions |
| `security` | **NEW** - Security services (Vault, Encryption, MFA, Audit) |
| `common` | **NEW** - Common utilities (Feature Flags) |
| `websocket` | Real-time communication |
| `validations` | Input validation |
| `errors` | Error handling |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- MySQL 8.0+
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/HealthFlowEgy/healthpay-monorepo-enhanced.git
cd healthpay-monorepo-enhanced

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate deploy

# Start development server
pnpm start:dev
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Authentication Flow

### Step 1: Merchant Authentication

Merchant authentication requires `api-header` and `apiKey` from your Healthpay merchant dashboard.

- All merchant requests **SHOULD** have `api-header: <api-header>` header
- All merchant requests **SHOULD** have `Authorization: bearer <token>` header (except for `mutation authMerchant`)

### Step 2: User/Provider Authentication

After completing merchant authentication, use the obtained `token` to authenticate users/providers to your merchant.

## New Security Features (Enhanced Version)

This enhanced version includes several security improvements:

### 1. Secret Management with Vault

The `VaultService` provides secure secret management with environment variable fallback:

```typescript
import { VaultService } from '@app/security';

// Automatically falls back to env if Vault not configured
const apiKey = await vaultService.getSecret(
  'secret/data/api-key',
  'API_KEY' // fallback env var
);
```

### 2. Field-Level Encryption

The `EncryptionService` provides AES-256-GCM encryption for sensitive data:

```typescript
import { EncryptionService } from '@app/security';

// Encrypt sensitive data
const encrypted = await encryptionService.encrypt(phoneNumber);

// Decrypt when needed
const decrypted = await encryptionService.decrypt(encrypted);
```

### 3. Multi-Factor Authentication (MFA)

The `MfaService` provides TOTP-based MFA:

```typescript
import { MfaService } from '@app/security';

// Generate MFA secret and QR code
const { secret, qrCode } = await mfaService.generateSecret(userId, email);

// Verify OTP token
const isValid = await mfaService.verifyToken(secret, userToken);
```

### 4. Feature Flags

The `FeatureFlagsService` enables safe feature rollout:

```typescript
import { FeatureFlagsService } from '@app/common';

// Check if feature is enabled
if (featureFlags.isEnabled('ENCRYPTION_ENABLED')) {
  // Use encryption
}

// Percentage rollout
if (featureFlags.isEnabled('NEW_FEATURE', userId)) {
  // Show new feature to this user
}
```

### 5. Audit Logging

The `AuditService` provides comprehensive audit logging:

```typescript
import { AuditService } from '@app/security';

// Log authentication events
await auditService.logAuth(userId, 'LOGIN', { ip: clientIp });

// Log data access
await auditService.logDataAccess(userId, 'USER', resourceId, 'READ');

// Log transactions
await auditService.logTransaction(userId, txId, 'COMPLETED', amount);
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

### Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `FEATURE_ENCRYPTION_ENABLED` | Enable field-level encryption | `false` |
| `FEATURE_MFA_ENABLED` | Enable multi-factor authentication | `false` |
| `FEATURE_AUDIT_LOGGING` | Enable audit logging | `true` |
| `FEATURE_RATE_LIMITING` | Enable API rate limiting | `true` |

## Database Migrations

### Running Migrations

```bash
# Apply all pending migrations
pnpm prisma migrate deploy

# Create a new migration
pnpm prisma migrate dev --name migration_name
```

### Security Migrations

The `migrations/001_add_security_columns.sql` adds:
- Encrypted columns for sensitive data
- MFA-related columns
- Audit log table
- Feature flags table
- Session tracking table

### Data Migration Script

To encrypt existing user data:

```bash
# Dry run (no changes)
DRY_RUN=true npx ts-node scripts/migrate-encrypt-data.ts

# Apply encryption
ENCRYPTION_KEY=your-key npx ts-node scripts/migrate-encrypt-data.ts
```

## API Documentation

### GraphQL Playground

- hp-fence: http://localhost:3000/graphql
- hp-sword: http://localhost:3001/graphql

### REST API (Swagger)

- http://localhost:3000/api

## Deployment

### Docker Build

```bash
docker build -t healthpay-monorepo .
```

### CI/CD

The repository includes a `Jenkinsfile` for automated deployment:

1. Build Docker image
2. Push to DigitalOcean registry
3. Update Docker Swarm services

## Directory Structure

```
healthpay-monorepo/
├── apps/
│   ├── hp-fence/          # User API
│   ├── hp-sword/          # Merchant API
│   ├── hp-financing/      # Financing service
│   └── hp-nodejs/         # Utility service
├── libs/
│   ├── prisma/            # Database
│   ├── services/          # Business logic
│   ├── security/          # Security services (NEW)
│   ├── common/            # Common utilities (NEW)
│   ├── helpers/           # Utilities
│   ├── websocket/         # Real-time
│   ├── validations/       # Validation
│   └── errors/            # Error handling
├── migrations/            # SQL migrations (NEW)
├── scripts/               # Utility scripts (NEW)
├── views/                 # Handlebars templates
├── infra/                 # Infrastructure configs
├── docker-compose.yml
├── Dockerfile
├── Jenkinsfile
└── package.json
```

## License

Proprietary - All rights reserved

## Support

For support, contact the Healthpay team.
