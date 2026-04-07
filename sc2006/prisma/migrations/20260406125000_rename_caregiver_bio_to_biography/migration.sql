-- Align caregiver profile column name with Prisma schema and app code
ALTER TABLE "caregiver_profiles"
RENAME COLUMN "bio" TO "biography";
