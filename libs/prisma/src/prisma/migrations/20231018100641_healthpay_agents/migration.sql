-- AlterTable
ALTER TABLE `PaymentRequest` ADD COLUMN `agentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `isAgent` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `two_factor_recovery_codes` TEXT NULL,
    ADD COLUMN `two_factor_secret` TEXT NULL;

-- CreateTable
CREATE TABLE `ActivityLogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `merchantId` INTEGER NULL,
    `activity_json` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentRequest` ADD CONSTRAINT `PaymentRequest_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLogs` ADD CONSTRAINT `ActivityLogs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLogs` ADD CONSTRAINT `ActivityLogs_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
