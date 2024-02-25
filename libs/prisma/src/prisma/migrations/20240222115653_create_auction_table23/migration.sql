/*
  Warnings:

  - You are about to drop the column `name` on the `AuctionUsers` table. All the data in the column will be lost.
  - Added the required column `name` to the `AuctionOffers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `AuctionOffers` ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `AuctionUsers` DROP COLUMN `name`;
