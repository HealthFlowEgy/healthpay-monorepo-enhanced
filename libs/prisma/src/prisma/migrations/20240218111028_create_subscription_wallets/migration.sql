-- AlterTable
ALTER TABLE `Balance` ADD COLUMN `isDueToWalletSub` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Wallet` ADD COLUMN `isSubscribable` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isSubscribed` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `WalletSubscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payerWalletId` INTEGER NOT NULL,
    `payeeWalletId` INTEGER NOT NULL,
    `activeTo` DATETIME(3) NULL,
    `status` ENUM('INVITED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'INVITED',
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WalletSubscription_payerWalletId_payeeWalletId_key`(`payerWalletId`, `payeeWalletId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WalletSubscription` ADD CONSTRAINT `WalletSubscription_payerWalletId_fkey` FOREIGN KEY (`payerWalletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletSubscription` ADD CONSTRAINT `WalletSubscription_payeeWalletId_fkey` FOREIGN KEY (`payeeWalletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
