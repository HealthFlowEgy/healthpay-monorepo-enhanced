/*
  Warnings:

  - You are about to drop the column `typeId` on the `CashOutRequest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `CashOutRequest` DROP FOREIGN KEY `cashoutrequest_ibfk_2`;

-- AlterTable
ALTER TABLE `CashOutRequest` DROP COLUMN `typeId`;
