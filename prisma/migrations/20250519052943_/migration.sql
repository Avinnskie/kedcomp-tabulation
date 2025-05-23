/*
  Warnings:

  - Changed the type of `position` on the `TeamAssignment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "TeamAssignment_teamId_roundAssignmentId_key";

-- AlterTable
ALTER TABLE "TeamAssignment" DROP COLUMN "position",
ADD COLUMN     "position" TEXT NOT NULL;
