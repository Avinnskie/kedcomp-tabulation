-- CreateEnum
CREATE TYPE "DebateRole" AS ENUM ('PrimeMinister', 'DeputyPrimeMinister', 'LeaderOfOpposition', 'DeputyLeaderOfOpposition', 'MemberOfGovernment', 'GovernmentWhip', 'MemberOfOpposition', 'OppositionWhip');

-- CreateTable
CREATE TABLE "ParticipantAssignment" (
    "id" TEXT NOT NULL,
    "participantId" INTEGER NOT NULL,
    "matchResultId" INTEGER NOT NULL,
    "role" "DebateRole" NOT NULL,

    CONSTRAINT "ParticipantAssignment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ParticipantAssignment" ADD CONSTRAINT "ParticipantAssignment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantAssignment" ADD CONSTRAINT "ParticipantAssignment_matchResultId_fkey" FOREIGN KEY ("matchResultId") REFERENCES "MatchResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
