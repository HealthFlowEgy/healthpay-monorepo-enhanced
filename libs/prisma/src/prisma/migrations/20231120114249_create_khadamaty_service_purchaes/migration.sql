/*
  Warnings:

  - You are about to drop the column `data` on the `UserPayoutServiceRequest` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uid]` on the table `UserPayoutServiceRequest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uid` to the `UserPayoutServiceRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `UserPayoutServiceRequest` DROP COLUMN `data`,
    ADD COLUMN `fields` JSON NULL,
    ADD COLUMN `serviceId` INTEGER NULL,
    ADD COLUMN `status` ENUM('PENDING', 'CANCELLED', 'COMPLETED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `uid` VARCHAR(191) NOT NULL,
    MODIFY `userId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `UserPayoutServiceRequest_uid_key` ON `UserPayoutServiceRequest`(`uid`);
