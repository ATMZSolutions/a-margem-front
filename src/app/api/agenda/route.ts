import { NextResponse } from "next/server";
import { listPublicAgenda } from "@/lib/publicContent";

export async function GET() {
  try {
    const items = await listPublicAgenda();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Erro ao buscar agenda:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}
