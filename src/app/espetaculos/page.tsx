import BackBtn from "@/components/BackBtn";
import Link from "next/link";
import { slugify } from "@/utils/helpers";

const espetaculosData = [
    {
        title: 'Muximba',
        release: '2024',
        img: "/muximba-coletivo.jpg"
    },
    {
        title: 'Xirê',
        release: '2023',
        img: "/xire-coletivo.jpg"
    }
];

export default function EspetaculosPage() {
  const sortedShows = espetaculosData.sort((a, b) => Number(a.release) - Number(b.release)).reverse()

  const espetaculos = sortedShows.map((item, index) => {
    const slugname = slugify(item.title)
    const href = `/espetaculos/${slugname}`;

    return (
      <Link
        key={index}
        href={href}
        style={{ color: "white" }}
        className="flex flex-col cursor-pointer mx-2"
      >
          <img src={item.img} alt={`Evento de ${item.title}`} className="h-[200px] md:h-[300px] max-w-[300px] md:max-w-[500px] object-cover" />
          <div className="flex flex-row justify-between">
            <span className="text-black">{item.release}</span>
            <span className="text-4xl md:text-5xl text-black">{item.title}</span>
          </div>
      </Link>
    )
  })

  return (
    <section
      className="relative bg-[#F38901] min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      <BackBtn label="Espetáculos" />
      <div className='max-w-xl md:max-w-2xl mt-40 flex flex-col gap-12'>
          {espetaculos}
      </div>
    </section>
  );
}

