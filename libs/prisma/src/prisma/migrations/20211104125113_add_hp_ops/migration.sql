-- AlterTable
ALTER TABLE `User` ADD COLUMN `cashInOpsId` INTEGER,
    ADD COLUMN `cashOutOpsId` INTEGER,
    ADD COLUMN `transferOpsId` INTEGER;

-- CreateTable
CREATE TABLE `Operation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191),
    `img` VARCHAR(191),
    `isPercentage` BOOLEAN NOT NULL DEFAULT true,
    `agreement` DOUBLE NOT NULL DEFAULT 1,
    `isAgreementPercentage` BOOLEAN NOT NULL DEFAULT true,
    `type` ENUM('CASH_IN', 'CASH_OUT', 'TRANSFER') NOT NULL,
    `payable` DOUBLE NOT NULL,
    `receivable` DOUBLE NOT NULL DEFAULT 100,
    `extraFees` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Operation.uid_unique`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD FOREIGN KEY (`cashInOpsId`) REFERENCES `Operation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD FOREIGN KEY (`cashOutOpsId`) REFERENCES `Operation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD FOREIGN KEY (`transferOpsId`) REFERENCES `Operation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
