/*
  Warnings:

  - You are about to drop the `ParticipantAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AssignmentTeams` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PositionEnum" AS ENUM ('OG', 'OO', 'CG', 'CO');

-- CreateEnum
CREATE TYPE "SpeakerPosition" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'REPLY');

-- DropForeignKey
ALTER TABLE "ParticipantAssignment" DROP CONSTRAINT "ParticipantAssignment_matchResultId_fkey";

-- DropForeignKey
ALTER TABLE "ParticipantAssignment" DROP CONSTRAINT "ParticipantAssignment_participantId_fkey";

-- DropForeignKey
ALTER TABLE "_AssignmentTeams" DROP CONSTRAINT "_AssignmentTeams_A_fkey";

-- DropForeignKey
ALTER TABLE "_AssignmentTeams" DROP CONSTRAINT "_AssignmentTeams_B_fkey";

-- DropTable
DROP TABLE "ParticipantAssignment";

-- DropTable
DROP TABLE "_AssignmentTeams";

-- DropEnum
DROP TYPE "DebateRole";

-- CreateTable
CREATE TABLE "TeamAssignment" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "roundAssignmentId" INTEGER NOT NULL,
    "position" "PositionEnum" NOT NULL,

    CONSTRAINT "TeamAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamAssignment_teamId_roundAssignmentId_key" ON "TeamAssignment"("teamId", "roundAssignmentId");

-- AddForeignKey
ALTER TABLE "TeamAssignment" ADD CONSTRAINT "TeamAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAssignment" ADD CONSTRAINT "TeamAssignment_roundAssignmentId_fkey" FOREIGN KEY ("roundAssignmentId") REFERENCES "RoundAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
