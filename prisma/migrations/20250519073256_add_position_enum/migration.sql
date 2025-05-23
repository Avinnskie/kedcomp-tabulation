/*
  Warnings:

  - Changed the type of `position` on the `TeamAssignment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "TeamAssignment" DROP COLUMN "position",
ADD COLUMN     "position" "PositionEnum" NOT NULL;
