/*
  Warnings:

  - A unique constraint covering the columns `[token,userId]` on the table `UserNotifyTokens` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `token_to_user_unique` ON `UserNotifyTokens`(`token`, `userId`);
