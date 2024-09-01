/*
  Warnings:

  - You are about to drop the `KhadamatyServices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `KhadamatyServices`;

-- CreateTable
CREATE TABLE `BillPaymentService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` JSON NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BillPaymentService_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
