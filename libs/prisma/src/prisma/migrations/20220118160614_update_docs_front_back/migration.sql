/*
  Warnings:

  - You are about to drop the column `nationalDoc` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `nationalDoc`,
    ADD COLUMN `nationalDocBack` VARCHAR(191) NULL,
    ADD COLUMN `nationalDocFront` VARCHAR(191) NULL;
