-- AlterTable
ALTER TABLE `Admin` MODIFY `remember_token` TEXT;

-- AlterTable
ALTER TABLE `Balance` ADD COLUMN `confirmedAt` DATETIME(3),
    ADD COLUMN `rejectedAt` DATETIME(3);

-- AlterTable
ALTER TABLE `User` ADD COLUMN `remember_token` TEXT;
