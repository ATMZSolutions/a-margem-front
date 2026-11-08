import { NextResponse } from "next/server";
import { listPublicNews } from "@/lib/publicContent";

export async function GET() {
  try {
    const items = await listPublicNews();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}
