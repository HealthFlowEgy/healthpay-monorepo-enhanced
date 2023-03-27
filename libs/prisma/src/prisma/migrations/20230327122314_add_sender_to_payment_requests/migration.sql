-- DropForeignKey
ALTER TABLE `PaymentRequest` DROP FOREIGN KEY `PaymentRequest_merchantId_fkey`;

-- DropForeignKey
ALTER TABLE `PaymentRequest` DROP FOREIGN KEY `PaymentRequest_userId_fkey`;

-- AlterTable
ALTER TABLE `PaymentRequest` ADD COLUMN `consent` ENUM('FORCED', 'ACCEPTED', 'PENDING', 'DECLINED') NOT NULL DEFAULT 'FORCED',
    ADD COLUMN `senderId` INTEGER NULL,
    MODIFY `userId` INTEGER NULL,
    MODIFY `merchantId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `PaymentRequest` ADD CONSTRAINT `PaymentRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentRequest` ADD CONSTRAINT `PaymentRequest_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentRequest` ADD CONSTRAINT `PaymentRequest_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
