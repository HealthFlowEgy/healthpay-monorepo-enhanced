/*
  Warnings:

  - You are about to drop the column `cashIn` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `cashOut` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `transfer` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `uid` on the `SiteSettings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `SiteSettings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `SiteSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `SiteSettings` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `SiteSettings_uid_key` ON `SiteSettings`;

-- AlterTable
ALTER TABLE `SiteSettings` DROP COLUMN `cashIn`,
    DROP COLUMN `cashOut`,
    DROP COLUMN `transfer`,
    DROP COLUMN `uid`,
    ADD COLUMN `key` VARCHAR(191) NOT NULL,
    ADD COLUMN `value` BOOLEAN NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `SiteSettings_key_key` ON `SiteSettings`(`key`);
