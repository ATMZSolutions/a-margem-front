export interface Integrante {
  id: string;
  nome: string;
  image: string;
  fichaTecnica: string;
  biografia: string;
}

export const integrantes: Integrante[] = [
  {
    id: "bento",
    nome: "Bento",
    image: "/coletivo/bento.webp",
    fichaTecnica: "Instrumento: Violão | Função: Vocal",
    biografia: "Bento é um músico apaixonado por MPB e composições autorais.",
  },
  {
    id: "cas",
    nome: "Cas",
    image: "/coletivo/cas.webp",
    fichaTecnica: "Instrumento: Baixo | Função: Backing Vocal",
    biografia: "Cas toca baixo desde os 12 anos e adora grooves marcantes.",
  },
  {
    id: "duda",
    nome: "Duda",
    image: "/coletivo/duda.webp",
    fichaTecnica: "Instrumento: Bateria | Função: Percussão",
    biografia: "Duda é baterista e compositor, especializado em ritmos brasileiros.",
  },
  {
    id: "guerra",
    nome: "Maria Guerra",
    image: "/coletivo/guerra.webp",
    fichaTecnica:
      "Formação: Teatro/Licenciatura (UFPE) | Atuação: Atriz-MC, Poeta, Enc. | Coletivo: À Margem",
    biografia: `Maria Guerra é atriz-MC, poeta marginal e encenadora formada em Teatro/Licenciatura pela Universidade Federal de Pernambuco (UFPE). 
No audiovisual, atuou nos curta-metragens MONO (2021), dirigido por Roberto Bezerra, e Ontem foi dia 22 de Junho, com direção de Wandryu Figuerêdo.
No teatro, integrou o elenco do espetáculo Títeres de Porrete: Tragicomédia de Dom Cristovão e Sinhá Rosinha, dirigido por Izabel Concessa. A montagem foi apresentada no 20º Festival Estudantil de Teatro e Dança (FETED) em 2023, no Palco Giratório (2024), no 20º Festival de Teatro de Limoeiro (FESTEL) (2024), e no 30º Janeiro de Grandes Espetáculos (2024). Em 2025, atuou como atriz-MC convidada no show lítero-musical O Menestrel, dirigido por Márcio Fecher, declamando poesias em quatro noites de espetáculo, na cidade do Recife.
Maria Guerra também é co-diretora do espetáculo XIRÊ, obra que foi apresentada no XXIV ENEARTE em Minas Gerais (2023), no Festival Pernambuco meu País (2024), na Mostra OFFRec do 23° Festival Recife do Teatro Nacional (2024), no 31º Janeiro de Grandes Espetáculos (2025), e na Mostra Nacional de Teatro Universitário da TUSP, em São Paulo (2025). 
Em sua trajetória, realizou apresentações teatrais promovidas pela EMLURB (Autarquia de Manutenção e Limpeza Urbana do Recife) em diferentes espaços de Recife (2022-2024), chegando a atuar em uma apresentação teatral no Consulado Geral dos Estados Unidos da América em Recife, em 2024.
Na área da produção e arte-educação, Maria Guerra realizou, com o Coletivo À Margem, Oficinas de Teatro Hip-Hop na Região Metropolitana do Recife em 2024, através da Lei Paulo Gustavo 2023. Foi da comissão organizadora da "Parceria entre o Festival de Teatro do Agreste (Feteag) e a UFPE 2022" e do projeto "Terça em Cena" (2022). 
Participou, ainda, do IX Jornadas Internacionais de Teatro do Oprimido e Universidade (JITOU), como atriz em 2021 e concluiu o curso "Ação-Reflexão: O jogo da árvore do TO como introdução ao método" no mesmo ano.
Com o Coletivo À Margem, seu trabalho foi reconhecido com o "Troféu Construtores da Cultura de Paz" no XIV ESPIRITOARTELIDADE: A Arte do Espírito e o Espírito da Arte (Recife, 2024).`,
  },
  {
    id: "ina",
    nome: "Iná",
    image: "/coletivo/ina.webp",
    fichaTecnica: "Instrumento: Flauta | Função: Solos",
    biografia: "Iná é flautista com experiência em música clássica e experimental.",
  },
  {
    id: "torres",
    nome: "Torres",
    image: "/coletivo/torres.webp",
    fichaTecnica: "Instrumento: Guitarra | Função: Solo",
    biografia: "Torres é guitarrista e arranjador, com influências de rock e jazz.",
  },
];
