/*
  Warnings:

  - You are about to alter the column `status` on the `AuctionOffers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum("AuctionOffers_status")`.

*/
-- AlterTable
ALTER TABLE `AuctionOffers` MODIFY `status` ENUM('PENDING', 'CANCELLED', 'COMPLETED', 'DECLINED') NOT NULL DEFAULT 'PENDING';
