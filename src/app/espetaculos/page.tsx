import EspetaculosClient from "./EspetaculosClient";
import { listPublishedEspetaculos } from "@/lib/publicContent";

export const dynamic = "force-dynamic";

export default async function EspetaculosPage() {
  const espetaculos = await listPublishedEspetaculos();
  return <EspetaculosClient espetaculos={espetaculos} />;
}
