import PhotoCarousel from "@/components/PhotoCarousel";
import Image from "next/image";

const randomImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
];

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center max-w-screen min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <PhotoCarousel
          images={randomImages}
          topButton={{ show: true, label: "Conheça o Coletivo", href: "/coletivo" }}
        />
        <PhotoCarousel
          images={randomImages}
          topButton={{ show: false, label: "Conheça o Coletivo", href: "/coletivo" }}
        />
      </main>
    </div>
  );
}
