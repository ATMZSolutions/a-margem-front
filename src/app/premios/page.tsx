import BackBtn from "@/components/BackBtn";
import Premio from "@/components/Premio";
import { listPublishedPremios } from "@/lib/publicContent";

export const dynamic = "force-dynamic";

export default async function PremiosPage() {
  const premios = await listPublishedPremios();

  return (
    <section
      className="relative bg-[#412551] min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{ backgroundImage: "url('/padrao2.webp')" }}
    >
      <BackBtn label="Prêmios" />
      {premios.length === 0 ? (
        <p className="mt-40 text-center">Nenhum prêmio publicado no momento.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-10 mt-44 w-full max-w-6xl px-4 mx-auto">
          {premios.map((premio) => (
            <div key={premio.id} className="flex justify-center">
              <Premio title={premio.title} evento={premio.evento} year={premio.year} slug={premio.slug} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
