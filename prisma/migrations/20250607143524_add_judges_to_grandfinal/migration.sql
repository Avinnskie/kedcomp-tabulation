-- CreateTable
CREATE TABLE "_GrandFinalJudges" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GrandFinalJudges_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GrandFinalJudges_B_index" ON "_GrandFinalJudges"("B");

-- AddForeignKey
ALTER TABLE "_GrandFinalJudges" ADD CONSTRAINT "_GrandFinalJudges_A_fkey" FOREIGN KEY ("A") REFERENCES "Judge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GrandFinalJudges" ADD CONSTRAINT "_GrandFinalJudges_B_fkey" FOREIGN KEY ("B") REFERENCES "RoundAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
