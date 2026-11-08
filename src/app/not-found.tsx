import { getPublicTransversalSettings } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const { textos } = await getPublicTransversalSettings();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center text-white">
      <h1 className="text-5xl font-bold mb-4">{textos.naoEncontradoTitulo}</h1>
      <p className="text-xl">{textos.naoEncontradoMensagem}</p>
    </div>
  );
}
