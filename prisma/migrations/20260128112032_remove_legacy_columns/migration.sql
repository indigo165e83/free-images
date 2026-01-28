/*
  Warnings:

  - You are about to drop the column `prompt` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Tag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nameJa,nameEn]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - Made the column `nameEn` on table `Tag` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nameJa` on table `Tag` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Tag_name_key";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "prompt";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "name",
ALTER COLUMN "nameEn" SET NOT NULL,
ALTER COLUMN "nameJa" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tag_nameJa_nameEn_key" ON "Tag"("nameJa", "nameEn");
