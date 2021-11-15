/*
  Warnings:

  - Added the required column `typeId` to the `CashOutRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CashOutRequest` ADD COLUMN `typeId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `CashOutRequest` ADD FOREIGN KEY (`typeId`) REFERENCES `CashOutTypes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
