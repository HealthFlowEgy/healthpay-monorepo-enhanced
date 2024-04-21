-- AlterTable
ALTER TABLE `MedCard` ADD COLUMN `merchantId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `MedCard` ADD CONSTRAINT `MedCard_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
