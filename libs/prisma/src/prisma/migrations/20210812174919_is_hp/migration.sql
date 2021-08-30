/*
  Warnings:

  - You are about to alter the column `isHp` on the `Merchant` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum("Merchant_isHp")`.

*/
-- AlterTable
ALTER TABLE `Merchant` MODIFY `isHp` ENUM('CASHOUT', 'PROFIT', 'CASHIN', 'REGULAR') DEFAULT 'REGULAR';
