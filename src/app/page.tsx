import ContactItem from "@/components/ContactItem";
import PhotoCarousel from "@/components/PhotoCarousel";
import { AtSign, Instagram, Mail, Phone } from "lucide-react";

const randomImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
];

export default function Home() {
  return (
    <div className="font-sans">
      {/* Seção 1 */}
      <section className="min-h-screen flex items-center justify-center bg-black text-white">
        <img
          src="/grito-de-guerra.svg"
          alt="Grito de Guerra"
          className="w-3/5 md:w-1/5"
        />
      </section>

      {/* Seção 2 */}
      <section className="min-h-screen flex items-center justify-center bg-[#681A01] text-black">
        <div className="flex flex-col items-center justify-center text-4xl font-bold">
          <h2 className="w-16">PRÓXIMOS EVENTOS</h2>
        </div>
      </section>

      {/* Seção 3 */}
      <section className="min-h-screen flex items-center justify-center bg-black text-white">
        <PhotoCarousel images={randomImages} />
      </section>

      {/* Seção 4 */}
      <section className="min-h-screen flex items-center justify-center bg-[#412551] text-black">
        <div className="space-y-3 font-medium text-white">
          <ContactItem
            icon={
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                <Phone size={18} color="#412551" />
              </span>
            }
            text="+55 (81) 9 8600-9096"
          />
          <ContactItem
            icon={
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                <Mail size={18} color="#412551" />
              </span>
            }
            text="coletivoamargem1@gmail.com"
          />
          <ContactItem
            icon={
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                <Instagram size={18} color="#412551" />
              </span>
            }
            text="@amargemcoletivo"
          />
          <ContactItem
            icon={
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                <AtSign size={18} color="#412551" />
              </span>
            }
            text="@coletivoamargem"
          />
        </div>
      </section>
    </div>
  );
}
