-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `msg_ar` VARCHAR(191);

-- CreateTable
CREATE TABLE `ValuHmac` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` VARCHAR(191) NOT NULL,
    `hmac` VARCHAR(191) NOT NULL,
    `userId` INTEGER,
    `isValid` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ValuHmac.uid_unique`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ValuHmac` ADD FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `PaymentRequest` RENAME INDEX `PaymentRequest_transactionId_unique` TO `PaymentRequest.transactionId_unique`;
