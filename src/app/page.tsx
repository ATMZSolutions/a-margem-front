import HomeClient from "./HomeClient";
import { getPublicHomeSettings, listPublicContacts } from "@/lib/siteContent";
import { isPublicSitePage } from "@/lib/siteMetadata";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!await isPublicSitePage("/")) notFound();
  const [settings, contacts] = await Promise.all([getPublicHomeSettings(), listPublicContacts()]);
  return <HomeClient settings={settings} contacts={contacts} />;
}
