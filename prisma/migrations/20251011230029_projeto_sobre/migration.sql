-- CreateTable
CREATE TABLE "Projeto" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sobre" (
    "ano" INTEGER NOT NULL,
    "imagem" TEXT,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Sobre_pkey" PRIMARY KEY ("ano")
);
