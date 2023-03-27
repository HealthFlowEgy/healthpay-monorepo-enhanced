-- DropForeignKey
ALTER TABLE `UserNotifyTokens` DROP FOREIGN KEY `UserNotifyTouserIdkens_userId_fkey`;

-- AlterTable
ALTER TABLE `CashOutRequest` ADD COLUMN `comment` TEXT NULL;

-- AlterTable
ALTER TABLE `SiteSettings` ADD COLUMN `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updatedAt` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `User` ADD COLUMN `nationalDoc` VARCHAR(101) NULL;

-- AddForeignKey
ALTER TABLE `UserNotifyTokens` ADD CONSTRAINT `UserNotifyTokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
