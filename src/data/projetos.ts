export interface TimelineItem {
  date: string;
  text: string;
}

export const projetosImgs: string[] = Array.from(
  { length: 15 },
  (_, i) => `/projetos/img${i + 1}.jpg`
);


export const fullItems: TimelineItem[] = [
  {
    text: "Oficina “Batalha teatral: a lírica do cotidiano sob a perspectiva do ator-mc”, ofertada na programação da Semana de Calouros do curso de Teatro/Licenciatura da UFPE. A atividade explorou as vivências dos participantes e a investigação da performance do ator-MC.",
    date: '2023-06-01T12:00:00Z'
  },
  {
    text: "O integrante Francisco Bento ministra uma oficina de teatro popular utilizando bases da metodologia do teatro hip-hop na Escola Sindical Nordeste da CUT.",
    date: '2023-06-14T12:00:00Z'
  },
  {
    text: "O Coletivo realiza uma oficina na Ocupação Cuca Legal, parte do Movimento dos Trabalhadores Sem Teto (MTST), realizado com jovens da comunidade.",
    date: '2024-04-12T12:00:00Z'
  },
  {
    text: "Oficina do projeto “Teatro Hip-Hop” (Lei Paulo Gustavo) no NEIMFA, em Joana Bezerra (Recife).",
    date: '2024-06-01T12:00:00Z'
  },
  {
    text: "Oficina do projeto “Teatro Hip-Hop” (Lei Paulo Gustavo) na Secretaria de Juventude e Esportes, Cohab (Cabo de Santo Agostinho).",
    date: '2024-06-02T12:00:00Z'
  },
  {
    text: "Oficina do projeto “Teatro Hip-Hop” (Lei Paulo Gustavo) na Associação dos Moradores Novo Horizonte, em Barra de Jangada (Jaboatão dos Guararapes).",
    date: '2024-06-08T12:00:00Z'
  },
  {
    text: "Oficina do projeto “Teatro Hip-Hop” (Lei Paulo Gustavo) no COMPAZ Governador Eduardo Campos, em Alto de Santa Terezinha (Recife).",
    date: '2024-06-09T12:00:00Z'
  },
  {
    text: "Oficina do projeto “Teatro Hip-Hop” (Lei Paulo Gustavo) no Centro comunitário Vivendo e Aprendendo, em Celeiro das Alegrias Futuras (Camaragibe).",
    date: '2024-06-15T12:00:00Z'
  },
  {
    text: "Oficina do projeto “Teatro Hip-Hop” (Lei Paulo Gustavo) no COMPAZ Governador Eduardo Campos, em Alto de Santa Terezinha (Recife).",
    date: '2024-06-16T12:00:00Z'
  },
  {
    text: "Oficina do projeto “Teatro Hip-Hop” (Lei Paulo Gustavo) no COMPAZ Professor Paulo Freire, no Ibura (Recife).",
    date: '2024-07-06T12:00:00Z'
  },
  {
    text: "Aula prática de teatro hip-hop para crianças no NEIMFA (Comunidade do Coque/Joana Bezerra), com distribuição de sacolinhas em comemoração a Cosme e Damião.",
    date: '2024-09-28T12:00:00Z'
  },
  {
    text: "Atividade ministrada por Cas Almeida e Maria Guerra para mulheres da comunidade na Associação de Moradores Novo Horizonte Resiste, em Barra de Jangada.",
    date: '2025-05-31T12:00:00Z'
  }
];