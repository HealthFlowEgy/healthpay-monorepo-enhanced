/*
  Warnings:

  - Added the required column `name` to the `AuctionUsers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `AuctionUsers` ADD COLUMN `name` VARCHAR(191) NOT NULL;
