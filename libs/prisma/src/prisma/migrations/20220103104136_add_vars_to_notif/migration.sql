-- DropForeignKey
ALTER TABLE `Balance` DROP FOREIGN KEY `Balance_ibfk_1`;

-- DropForeignKey
ALTER TABLE `Balance` DROP FOREIGN KEY `Balance_ibfk_3`;

-- DropForeignKey
ALTER TABLE `Balance` DROP FOREIGN KEY `Balance_ibfk_2`;

-- DropForeignKey
ALTER TABLE `Balance` DROP FOREIGN KEY `Balance_ibfk_4`;

-- DropForeignKey
ALTER TABLE `CashOutRequest` DROP FOREIGN KEY `CashOutRequest_ibfk_2`;

-- DropForeignKey
ALTER TABLE `CashOutRequest` DROP FOREIGN KEY `CashOutRequest_ibfk_1`;

-- DropForeignKey
ALTER TABLE `CashOutSettings` DROP FOREIGN KEY `CashOutSettings_ibfk_2`;

-- DropForeignKey
ALTER TABLE `CashOutSettings` DROP FOREIGN KEY `CashOutSettings_ibfk_1`;

-- DropForeignKey
ALTER TABLE `Merchant` DROP FOREIGN KEY `Merchant_ibfk_1`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_ibfk_1`;

-- DropForeignKey
ALTER TABLE `OTP` DROP FOREIGN KEY `OTP_ibfk_1`;

-- DropForeignKey
ALTER TABLE `PaymentRequest` DROP FOREIGN KEY `PaymentRequest_ibfk_2`;

-- DropForeignKey
ALTER TABLE `PaymentRequest` DROP FOREIGN KEY `PaymentRequest_ibfk_3`;

-- DropForeignKey
ALTER TABLE `PaymentRequest` DROP FOREIGN KEY `PaymentRequest_ibfk_1`;

-- DropForeignKey
ALTER TABLE `ProviderAuthMerchant` DROP FOREIGN KEY `ProviderAuthMerchant_ibfk_2`;

-- DropForeignKey
ALTER TABLE `ProviderAuthMerchant` DROP FOREIGN KEY `ProviderAuthMerchant_ibfk_1`;

-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_ibfk_2`;

-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_ibfk_1`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_ibfk_1`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_ibfk_2`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_ibfk_3`;

-- DropForeignKey
ALTER TABLE `UserAuthMerchant` DROP FOREIGN KEY `UserAuthMerchant_ibfk_2`;

-- DropForeignKey
ALTER TABLE `UserAuthMerchant` DROP FOREIGN KEY `UserAuthMerchant_ibfk_1`;

-- DropForeignKey
ALTER TABLE `UserNotifyTokens` DROP FOREIGN KEY `UserNotifyTokens_ibfk_1`;

-- DropForeignKey
ALTER TABLE `ValuHmac` DROP FOREIGN KEY `ValuHmac_ibfk_1`;

-- DropForeignKey
ALTER TABLE `Wallet` DROP FOREIGN KEY `Wallet_ibfk_1`;

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `vars` JSON NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_cashInOpsId_fkey` FOREIGN KEY (`cashInOpsId`) REFERENCES `Operation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_cashOutOpsId_fkey` FOREIGN KEY (`cashOutOpsId`) REFERENCES `Operation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_transferOpsId_fkey` FOREIGN KEY (`transferOpsId`) REFERENCES `Operation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ValuHmac` ADD CONSTRAINT `ValuHmac_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotifyTokens` ADD CONSTRAINT `UserNotifyTouserIdkens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Merchant` ADD CONSTRAINT `Merchant_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAuthMerchant` ADD CONSTRAINT `UserAuthMerchant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAuthMerchant` ADD CONSTRAINT `UserAuthMerchant_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderAuthMerchant` ADD CONSTRAINT `ProviderAuthMerchant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderAuthMerchant` ADD CONSTRAINT `ProviderAuthMerchant_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wallet` ADD CONSTRAINT `Wallet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Balance` ADD CONSTRAINT `Balance_payableMerchantId_fkey` FOREIGN KEY (`payableMerchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Balance` ADD CONSTRAINT `Balance_receivableMerchantId_fkey` FOREIGN KEY (`receivableMerchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Balance` ADD CONSTRAINT `Balance_payableWalletId_fkey` FOREIGN KEY (`payableWalletId`) REFERENCES `Wallet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Balance` ADD CONSTRAINT `Balance_receivableWalletId_fkey` FOREIGN KEY (`receivableWalletId`) REFERENCES `Wallet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_chargeFromMerchantId_fkey` FOREIGN KEY (`chargeFromMerchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashOutRequest` ADD CONSTRAINT `CashOutRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashOutRequest` ADD CONSTRAINT `CashOutRequest_cashOutMethodId_fkey` FOREIGN KEY (`cashOutMethodId`) REFERENCES `CashOutSettings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashOutSettings` ADD CONSTRAINT `CashOutSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashOutSettings` ADD CONSTRAINT `CashOutSettings_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `CashOutTypes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OTP` ADD CONSTRAINT `OTP_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentRequest` ADD CONSTRAINT `PaymentRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentRequest` ADD CONSTRAINT `PaymentRequest_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentRequest` ADD CONSTRAINT `PaymentRequest_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Admin` RENAME INDEX `Admin.email_unique` TO `Admin_email_key`;

-- RenameIndex
ALTER TABLE `Balance` RENAME INDEX `Balance.uid_unique` TO `Balance_uid_key`;

-- RenameIndex
ALTER TABLE `CashOutRequest` RENAME INDEX `CashOutRequest.uid_unique` TO `CashOutRequest_uid_key`;

-- RenameIndex
ALTER TABLE `CashOutSettings` RENAME INDEX `CashOutSettings.uid_unique` TO `CashOutSettings_uid_key`;

-- RenameIndex
ALTER TABLE `CashOutTypes` RENAME INDEX `CashOutTypes.name_unique` TO `CashOutTypes_name_key`;

-- RenameIndex
ALTER TABLE `Merchant` RENAME INDEX `Merchant.apiHeader_unique` TO `Merchant_apiHeader_key`;

-- RenameIndex
ALTER TABLE `Merchant` RENAME INDEX `Merchant.apiKey_unique` TO `Merchant_apiKey_key`;

-- RenameIndex
ALTER TABLE `Merchant` RENAME INDEX `Merchant.uid_unique` TO `Merchant_uid_key`;

-- RenameIndex
ALTER TABLE `Merchant` RENAME INDEX `name_ownerId_unique` TO `Merchant_name_ownerId_key`;

-- RenameIndex
ALTER TABLE `Operation` RENAME INDEX `Operation.uid_unique` TO `Operation_uid_key`;

-- RenameIndex
ALTER TABLE `PaymentRequest` RENAME INDEX `PaymentRequest.transactionId_unique` TO `PaymentRequest_transactionId_key`;

-- RenameIndex
ALTER TABLE `PaymentRequest` RENAME INDEX `PaymentRequest.uid_unique` TO `PaymentRequest_uid_key`;

-- RenameIndex
ALTER TABLE `ProviderAuthMerchant` RENAME INDEX `ProviderAuthMerchant.uid_unique` TO `ProviderAuthMerchant_uid_key`;

-- RenameIndex
ALTER TABLE `ProviderAuthMerchant` RENAME INDEX `merchantId_providerId_unique` TO `ProviderAuthMerchant_merchantId_userId_key`;

-- RenameIndex
ALTER TABLE `Sessions` RENAME INDEX `Sessions.id_unique` TO `Sessions_id_key`;

-- RenameIndex
ALTER TABLE `Transaction` RENAME INDEX `Transaction.uid_unique` TO `Transaction_uid_key`;

-- RenameIndex
ALTER TABLE `User` RENAME INDEX `User.email_unique` TO `User_email_key`;

-- RenameIndex
ALTER TABLE `User` RENAME INDEX `User.mobile_unique` TO `User_mobile_key`;

-- RenameIndex
ALTER TABLE `User` RENAME INDEX `User.uid_unique` TO `User_uid_key`;

-- RenameIndex
ALTER TABLE `UserAuthMerchant` RENAME INDEX `UserAuthMerchant.uid_unique` TO `UserAuthMerchant_uid_key`;

-- RenameIndex
ALTER TABLE `UserAuthMerchant` RENAME INDEX `merchantId_userId_unique` TO `UserAuthMerchant_merchantId_userId_key`;

-- RenameIndex
ALTER TABLE `UserNotifyTokens` RENAME INDEX `token_to_user_unique` TO `UserNotifyTokens_token_userId_key`;

-- RenameIndex
ALTER TABLE `ValuHmac` RENAME INDEX `ValuHmac.uid_unique` TO `ValuHmac_uid_key`;

-- RenameIndex
ALTER TABLE `Wallet` RENAME INDEX `Wallet.userId_unique` TO `Wallet_userId_key`;

-- RenameIndex
ALTER TABLE `personal_access_tokens` RENAME INDEX `personal_access_tokens.token_unique` TO `personal_access_tokens_token_key`;
