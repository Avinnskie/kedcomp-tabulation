/*
  Warnings:

  - The values [OPENING_GOVERNMENT,OPENING_OPPOSITION,CLOSING_GOVERNMENT,CLOSING_OPPOSITION] on the enum `DebatePosition` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DebatePosition_new" AS ENUM ('OG', 'OO', 'CG', 'CO');
ALTER TABLE "TeamAssignment" ALTER COLUMN "position" TYPE "DebatePosition_new" USING ("position"::text::"DebatePosition_new");
ALTER TYPE "DebatePosition" RENAME TO "DebatePosition_old";
ALTER TYPE "DebatePosition_new" RENAME TO "DebatePosition";
DROP TYPE "DebatePosition_old";
COMMIT;
