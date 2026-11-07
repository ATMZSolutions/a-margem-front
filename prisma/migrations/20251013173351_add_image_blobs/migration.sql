/*
  Warnings:

  - The `imagem` column on the `Livro` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `imagem` column on the `Sobre` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Livro" ADD COLUMN     "imagemTipo" TEXT,
DROP COLUMN "imagem",
ADD COLUMN     "imagem" BYTEA;

-- AlterTable
ALTER TABLE "Sobre" ADD COLUMN     "imagemTipo" TEXT,
DROP COLUMN "imagem",
ADD COLUMN     "imagem" BYTEA;
