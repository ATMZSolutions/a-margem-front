import React from "react";

interface NoticiaItem {
  id: number;
  titulo: string;
  conteudo: string;
  link: string;
  createdAt: string;
}

interface MainProps {
  noticias: NoticiaItem[];
}

const Main = ({ noticias }: MainProps) => {
  return (
    <section className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-[70vh]">
        <img
          src="/grito-de-guerra.svg"
          alt="Grito de Guerra"
          className="w-3/5 md:w-1/5"
        />
      </div>
      
      {/* Recent News Section */}
      {noticias.length > 0 && (
        <div className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-[#F5A623]">
              ÚLTIMAS NOTÍCIAS
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {noticias.map((noticia) => {
                const createdDate = new Date(noticia.createdAt);
                const formattedDate = createdDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });
                
                return (
                  <article
                    key={noticia.id}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-6 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="mb-3">
                      <span className="text-xs text-[#F5A623] font-medium">
                        {formattedDate}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                      {noticia.titulo}
                    </h3>
                    
                    <p className="text-white/80 text-sm line-clamp-3 mb-4">
                      {noticia.conteudo}
                    </p>

                    <a href={noticia.link} className="text-blue-400 hover:underline mt-2 break-all">
                      {noticia.link}
                    </a>

                    <div className="text-right">
                      <span className="text-[#F5A623] text-sm hover:underline cursor-pointer">
                        Leia mais →
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
            
            <div className="text-center mt-10">
              <a
                href="/noticias"
                className="inline-block bg-[#F5A623] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#F5A623]/90 transition-colors"
              >
                Ver todas as notícias
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Main;
