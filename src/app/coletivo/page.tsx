import ColetivoClient from "./ColetivoClient";
import { listPublishedIntegrantes } from "@/lib/publicContent";

export const dynamic = "force-dynamic";

export default async function ColetivoPage() {
  const integrantes = await listPublishedIntegrantes();
  return <ColetivoClient integrantes={integrantes} />;
}
