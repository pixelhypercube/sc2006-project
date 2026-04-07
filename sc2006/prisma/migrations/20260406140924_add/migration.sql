-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('SAFETY', 'UNRESPONSIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "IncidentPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "resolved_by_id" TEXT,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "IncidentPriority" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidents_booking_id_idx" ON "incidents"("booking_id");

-- CreateIndex
CREATE INDEX "incidents_reporter_id_idx" ON "incidents"("reporter_id");

-- CreateIndex
CREATE INDEX "incidents_caregiver_id_idx" ON "incidents"("caregiver_id");

-- CreateIndex
CREATE INDEX "incidents_status_created_at_idx" ON "incidents"("status", "created_at");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
