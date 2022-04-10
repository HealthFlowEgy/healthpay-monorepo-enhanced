/*
  Warnings:

  - You are about to drop the `ValuHmac` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ValuHmac` DROP FOREIGN KEY `ValuHmac_userId_fkey`;

-- DropTable
DROP TABLE `ValuHmac`;
