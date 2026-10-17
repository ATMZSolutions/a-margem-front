import prisma from "@/lib/prisma";

export interface BookListing {
  id: number;
  titulo: string;
  autor: string;
  descricao: string;
  hasImage: boolean;
  createdAt: Date;
}

export interface SobreListing {
  ano: number;
  descricao: string;
  hasImage: boolean;
}

export function listBookListings() {
  return prisma.$queryRaw<BookListing[]>`
    SELECT "id", "titulo", "autor", "descricao",
      ("imagem" IS NOT NULL) AS "hasImage", "createdAt"
    FROM "Livro"
    ORDER BY "createdAt" DESC
  `;
}

export function listSobreListings(order: "asc" | "desc" = "desc") {
  if (order === "asc") {
    return prisma.$queryRaw<SobreListing[]>`
      SELECT "ano", "descricao", ("imagem" IS NOT NULL) AS "hasImage"
      FROM "Sobre"
      ORDER BY "ano" ASC
    `;
  }
  return prisma.$queryRaw<SobreListing[]>`
    SELECT "ano", "descricao", ("imagem" IS NOT NULL) AS "hasImage"
    FROM "Sobre"
    ORDER BY "ano" DESC
  `;
}
