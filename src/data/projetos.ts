export interface TimelineItem {
  date: string;
  text: string;
}

export const projetosImgs: string[] = Array.from(
  { length: 15 },
  (_, i) => `/projetos/img${i + 1}.jpg`
);
