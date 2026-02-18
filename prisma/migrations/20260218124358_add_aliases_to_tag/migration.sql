-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "aliasesEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "aliasesJa" TEXT[] DEFAULT ARRAY[]::TEXT[];
