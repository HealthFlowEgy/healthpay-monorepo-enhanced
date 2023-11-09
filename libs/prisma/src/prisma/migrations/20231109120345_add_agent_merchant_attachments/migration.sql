-- AlterTable
ALTER TABLE `User` ADD COLUMN `attachedMerchantId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_attachedMerchantId_fkey` FOREIGN KEY (`attachedMerchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
