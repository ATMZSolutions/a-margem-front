import { NextResponse } from "next/server";
import { listSobreListings } from "@/lib/publicContent";

export async function GET() {
  const items = await listSobreListings();
  return NextResponse.json(items.map((item) => ({
    ano: item.ano,
    descricao: item.descricao,
    imageUrl: item.hasImage ? `/api/image/sobre/${item.ano}` : null,
  })));
}
