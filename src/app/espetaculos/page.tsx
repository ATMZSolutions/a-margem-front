import EspetaculosClient from "./EspetaculosClient";
import { listPublishedEspetaculos } from "@/lib/publicContent";
import { isPublicSitePage } from "@/lib/siteMetadata";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EspetaculosPage() {
  if (!await isPublicSitePage("/espetaculos")) notFound();
  const espetaculos = await listPublishedEspetaculos();
  return <EspetaculosClient espetaculos={espetaculos} />;
}
