import { NextResponse } from "next/server";
import { listPublicProjects } from "@/lib/publicContent";

export async function GET() {
  try {
    const items = await listPublicProjects();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}
