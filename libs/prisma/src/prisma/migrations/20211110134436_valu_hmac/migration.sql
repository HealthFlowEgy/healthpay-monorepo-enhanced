-- AlterTable
ALTER TABLE `ValuHmac` ADD COLUMN `isComplete` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `loanNumber` VARCHAR(191);
