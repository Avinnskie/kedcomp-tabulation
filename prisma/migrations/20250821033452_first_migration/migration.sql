/*
  Warnings:

  - You are about to drop the `_GrandFinalJudges` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_GrandFinalJudges" DROP CONSTRAINT "_GrandFinalJudges_A_fkey";

-- DropForeignKey
ALTER TABLE "_GrandFinalJudges" DROP CONSTRAINT "_GrandFinalJudges_B_fkey";

-- DropTable
DROP TABLE "_GrandFinalJudges";
