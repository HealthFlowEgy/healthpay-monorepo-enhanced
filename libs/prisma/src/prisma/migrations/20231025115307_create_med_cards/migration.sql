-- CreateTable
CREATE TABLE `MedCard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` VARCHAR(191) NOT NULL,
    `nationalId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `nameOnCard` VARCHAR(191) NOT NULL,
    `birthDate` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `relationId` VARCHAR(191) NULL,
    `userId` INTEGER NULL,
    `img` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MedCard_uid_key`(`uid`),
    UNIQUE INDEX `MedCard_nationalId_key`(`nationalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MedCard` ADD CONSTRAINT `MedCard_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
