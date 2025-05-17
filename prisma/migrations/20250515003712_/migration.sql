-- CreateTable
CREATE TABLE "MatchResult" (
    "id" SERIAL NOT NULL,
    "roundAssignmentId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_roundAssignmentId_fkey" FOREIGN KEY ("roundAssignmentId") REFERENCES "RoundAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
