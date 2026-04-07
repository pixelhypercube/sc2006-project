/*
  Warnings:

  - You are about to drop the column `userId` on the `caregiver_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `booking_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the `booking_pets` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[owner_id,caregiver_id,pet_id,start_date]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verificationToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetPasswordToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pet_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `caregiver_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chat_id` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `pets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DogSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('BOARDING', 'HOUSE_SITTING', 'DROP_IN', 'DAYCARE', 'WALKING', 'BATHING', 'NAILS', 'EARS', 'TEETH', 'DESHEDDING', 'TRAINING_PUPPY', 'TRAINING_OBEDIENCE', 'TRAINING_BEHAVIOR', 'TRAINING_AGILITY', 'MED_ORAL', 'MED_INJECT', 'MED_RECOVERY', 'MED_SENIOR', 'MED_WOUND', 'TAXI', 'WEDDING', 'CLEANING');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LOCKED');

-- CreateEnum
CREATE TYPE "VerificationAction" AS ENUM ('APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WELCOME';

-- DropForeignKey
ALTER TABLE "booking_pets" DROP CONSTRAINT "booking_pets_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_pets" DROP CONSTRAINT "booking_pets_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "caregiver_profiles" DROP CONSTRAINT "caregiver_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_userId_fkey";

-- DropIndex
DROP INDEX "bookings_owner_id_caregiver_id_start_date_key";

-- DropIndex
DROP INDEX "caregiver_profiles_userId_key";

-- DropIndex
DROP INDEX "messages_booking_id_idx";

-- DropIndex
DROP INDEX "messages_sender_id_receiver_id_idx";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "pet_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "caregiver_profiles" DROP COLUMN "userId",
ADD COLUMN     "dog_sizes" "DogSize"[],
ADD COLUMN     "is_accepting_requests" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "services" "ServiceType"[];

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "booking_id",
DROP COLUMN "read",
DROP COLUMN "receiver_id",
DROP COLUMN "userId",
ADD COLUMN     "attachment_name" TEXT,
ADD COLUMN     "attachment_type" TEXT,
ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "chat_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "vaccinationStatus" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "biography" TEXT,
ADD COLUMN     "resetPasswordExpiry" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpiry" TIMESTAMP(3);

-- DropTable
DROP TABLE "booking_pets";

-- CreateTable
CREATE TABLE "verification_records" (
    "id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" "VerificationAction" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "last_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_records_caregiver_id_idx" ON "verification_records"("caregiver_id");

-- CreateIndex
CREATE INDEX "verification_records_admin_id_idx" ON "verification_records"("admin_id");

-- CreateIndex
CREATE INDEX "verification_records_created_at_idx" ON "verification_records"("created_at");

-- CreateIndex
CREATE INDEX "chats_owner_id_caregiver_id_idx" ON "chats"("owner_id", "caregiver_id");

-- CreateIndex
CREATE INDEX "chats_updated_at_idx" ON "chats"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "chats_owner_id_caregiver_id_key" ON "chats"("owner_id", "caregiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_owner_id_caregiver_id_pet_id_start_date_key" ON "bookings"("owner_id", "caregiver_id", "pet_id", "start_date");

-- CreateIndex
CREATE INDEX "messages_chat_id_idx" ON "messages"("chat_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "pets_type_idx" ON "pets"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_verificationToken_key" ON "users"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetPasswordToken_key" ON "users"("resetPasswordToken");

-- AddForeignKey
ALTER TABLE "caregiver_profiles" ADD CONSTRAINT "caregiver_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_records" ADD CONSTRAINT "verification_records_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "caregiver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_records" ADD CONSTRAINT "verification_records_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
