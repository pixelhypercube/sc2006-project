-- Add caregiver availability window fields
ALTER TABLE "caregiver_profiles"
ADD COLUMN "availability_start_date" TIMESTAMP(3),
ADD COLUMN "availability_end_date" TIMESTAMP(3);
