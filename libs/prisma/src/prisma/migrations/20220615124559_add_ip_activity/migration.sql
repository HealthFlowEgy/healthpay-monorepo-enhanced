-- CreateTable
CREATE TABLE `IpActivity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ipAddess` VARCHAR(191) NOT NULL,
    `merchantId` INTEGER NULL,
    `action` VARCHAR(191) NULL,
    `ops` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `IpActivity` ADD CONSTRAINT `IpActivity_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
