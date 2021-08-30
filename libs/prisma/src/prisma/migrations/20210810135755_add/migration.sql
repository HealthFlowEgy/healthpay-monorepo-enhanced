/*
  Warnings:

  - Added the required column `creditorNo` to the `CashOutRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeId` to the `CashOutRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CashOutRequest` ADD COLUMN `creditorNo` VARCHAR(191) NOT NULL,
    ADD COLUMN `typeId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `CashOutTypes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `abbreviation` VARCHAR(191),
    `bic` VARCHAR(191),
    `notes` VARCHAR(191),
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3),

    UNIQUE INDEX `CashOutTypes.name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashOutTypeLength` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `length` INTEGER NOT NULL,
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CashOutTypeLengthToCashOutTypes` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CashOutTypeLengthToCashOutTypes_AB_unique`(`A`, `B`),
    INDEX `_CashOutTypeLengthToCashOutTypes_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CashOutRequest` ADD FOREIGN KEY (`typeId`) REFERENCES `CashOutTypes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CashOutTypeLengthToCashOutTypes` ADD FOREIGN KEY (`A`) REFERENCES `CashOutTypeLength`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CashOutTypeLengthToCashOutTypes` ADD FOREIGN KEY (`B`) REFERENCES `CashOutTypes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
