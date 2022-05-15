/*
  Warnings:

  - You are about to drop the `financingCompany` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `financingCompanyAdmin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `financingRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `financingCompanyAdmin` DROP FOREIGN KEY `financingCompanyAdmin_financingCompanyId_fkey`;

-- DropForeignKey
ALTER TABLE `financingRequest` DROP FOREIGN KEY `financingRequest_financingCompanyId_fkey`;

-- DropForeignKey
ALTER TABLE `financingRequest` DROP FOREIGN KEY `financingRequest_userId_fkey`;

-- AlterTable
ALTER TABLE `CashOutRequest` ADD COLUMN `comment` TEXT NULL;

-- DropTable
DROP TABLE `financingCompany`;

-- DropTable
DROP TABLE `financingCompanyAdmin`;

-- DropTable
DROP TABLE `financingRequest`;

-- CreateTable
CREATE TABLE `FinancingCompany` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancingCompanyAdmin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `financingCompanyId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FinancingCompanyAdmin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancingRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DOUBLE NOT NULL,
    `userId` INTEGER NOT NULL,
    `financingCompanyId` INTEGER NULL,
    `status` ENUM('INPROGRESS', 'PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `isTransfered` BOOLEAN NOT NULL DEFAULT false,
    `transferedAt` DATETIME(3) NULL,
    `financingAmount` DOUBLE NULL,
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FinancingCompanyAdmin` ADD CONSTRAINT `FinancingCompanyAdmin_financingCompanyId_fkey` FOREIGN KEY (`financingCompanyId`) REFERENCES `FinancingCompany`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancingRequest` ADD CONSTRAINT `FinancingRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancingRequest` ADD CONSTRAINT `FinancingRequest_financingCompanyId_fkey` FOREIGN KEY (`financingCompanyId`) REFERENCES `FinancingCompany`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
