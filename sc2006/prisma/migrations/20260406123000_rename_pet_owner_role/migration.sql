-- Rename legacy PET_OWNER enum value to OWNER so sign up and auth match the app schema
ALTER TYPE "Role" RENAME VALUE 'PET_OWNER' TO 'OWNER';
