-- CreateTable
CREATE TABLE `EarlyPaymentRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `acceptedamount` DOUBLE NULL,
    `name` VARCHAR(191) NULL,
    `details` VARCHAR(191) NULL,
    `attachments` JSON NULL,
    `merchantId` INTEGER NOT NULL,
    `status` ENUM('FORCED', 'ACCEPTED', 'PENDING', 'DECLINED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EarlyPaymentRequest_uid_key`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EarlyPaymentRequest` ADD CONSTRAINT `EarlyPaymentRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EarlyPaymentRequest` ADD CONSTRAINT `EarlyPaymentRequest_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
