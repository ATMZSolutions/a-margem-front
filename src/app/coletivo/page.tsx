import ColetivoClient from "./ColetivoClient";
import { listPublishedIntegrantes } from "@/lib/publicContent";
import { isPublicSitePage } from "@/lib/siteMetadata";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ColetivoPage() {
  if (!await isPublicSitePage("/coletivo")) notFound();
  const integrantes = await listPublishedIntegrantes();
  return <ColetivoClient integrantes={integrantes} />;
}
