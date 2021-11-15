/*
  Warnings:

  - You are about to drop the column `creditorNo` on the `CashOutRequest` table. All the data in the column will be lost.
  - You are about to drop the column `typeId` on the `CashOutRequest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `CashOutRequest` DROP FOREIGN KEY `cashoutrequest_ibfk_2`;

-- AlterTable
ALTER TABLE `Balance` MODIFY `type` ENUM('M2M', 'M2P', 'P2M', 'U2M', 'P2U', 'M2U', 'U2U', 'CASH_IN', 'CASH_OUT', 'REFUND', 'CASH_OUT_FAILED') NOT NULL DEFAULT 'U2U';

-- AlterTable
ALTER TABLE `CashOutRequest` DROP COLUMN `creditorNo`,
    DROP COLUMN `typeId`,
    ADD COLUMN `cashOutMethodId` INTEGER;

-- CreateTable
CREATE TABLE `CashOutSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` VARCHAR(191) NOT NULL,
    `userId` INTEGER,
    `typeId` INTEGER,
    `creditorNo` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CashOutSettings.uid_unique`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CashOutRequest` ADD FOREIGN KEY (`cashOutMethodId`) REFERENCES `CashOutSettings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashOutSettings` ADD FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashOutSettings` ADD FOREIGN KEY (`typeId`) REFERENCES `CashOutTypes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
