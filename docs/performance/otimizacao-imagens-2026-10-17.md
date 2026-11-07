# Atualização da otimização de imagens locais

**Data:** 17/10/2026

**Escopo:** arquivos estáticos de `public/`, com foco nas imagens da home. Imagens armazenadas no banco e o bundle JavaScript não entram nesta medição.

## Resultado

| Conjunto | Antes | Depois | Redução |
| --- | ---: | ---: | ---: |
| Nove fotos da home | 5.931.398 B | 1.423.264 B | 4.508.134 B (76,0%) |
| Logotipo `grito-de-guerra` | 989.669 B | 359.454 B | 630.215 B (63,7%) |
| Dez arquivos alterados | 6.921.067 B | 1.782.718 B | 5.138.349 B (74,2%) |
| Todo o diretório `public/` | 22.439.727 B | 17.301.378 B | 5.138.349 B (22,9%) |

- As nove fotos `/home/img1.jpg` a `/home/img9.jpg` foram substituídas por WebP com qualidade 90 e esforço 6, sem redimensionamento. Todas as saídas ficaram menores e preservaram a largura e a altura originais (1215 × 810 px). **WebP qualidade 90 usa compressão com perda:** não há equivalência exata de pixels nem avaliação visual em navegador neste relatório.
- O SVG `grito-de-guerra.svg` continha um PNG embutido de 1080 × 2000 px. Esse PNG foi extraído e codificado em WebP com `lossless: true` e `exact: true`. Os pixels RGBA decodificados do PNG e do novo WebP foram comparados byte a byte e são iguais. O novo arquivo é servido sem reprocessamento pelo `next/image` (`unoptimized`). A equivalência do layout no navegador ainda precisa de revisão visual.
- A home e o carrossel apontam para os novos arquivos. Redirecionamentos permanentes em `next.config.ts` preservam o acesso aos dez URLs antigos.
- As imagens foram removidas de `public/` após a geração das substitutas; o histórico do Git conserva os originais. O tamanho acima mede os ativos publicados, **não** o download da primeira visita: carregamento sob demanda, cache e variantes geradas pelo Next.js mudam a transferência real.

## O que ficou de fora

- Permanecem 42 JPEGs, somando 13.757.444 B. `public/espetaculos/xire/img8.jpg` continua sendo o maior, com 2.460.275 B. Uma conversão para WebP em qualidade 90 sem redimensionar aumentou esse arquivo; por isso ele foi mantido. Há outras fotografias JPEG já eficientes para as quais a mesma conversão também aumentaria o tamanho.
- O SVG `exu-bg.svg` contém um JPEG embutido. A tentativa de WebP qualidade 90 aumentou o payload embutido de 367.352 B para 445.488 B; ele foi mantido.
- O `next/image` ainda pode gerar variantes das fotos em qualidade 75 por padrão. Portanto, a qualidade 90 dos novos arquivos de origem não garante qualidade 90 nos bytes entregues ao navegador. O logotipo usa `unoptimized` para preservar seus pixels.
- Não houve medição de Lighthouse, Web Vitals, tráfego real, bundle JavaScript ou inspeção visual em dispositivos. Esses dados são necessários para afirmar melhora percebida e ausência de diferença visual.

## Próximos passos

1. Conferir a home em telas móveis e desktop, incluindo enquadramento do logotipo, cores das fotos e URLs antigos após o deploy.
2. Medir os bytes de `/_next/image`, LCP e tráfego da home em produção. Ajustar qualidade e `sizes` somente com essa comparação.
3. Avaliar redimensionamento das fotos muito grandes conforme o maior tamanho em que aparecem. Isso muda a resolução original e precisa de aprovação visual.

**Referências técnicas:** [Sharp — opções de saída WebP](https://sharp.pixelplumbing.com/api-output/) e [Next.js 15 — componente Image](https://nextjs.org/docs/15/app/api-reference/components/image).
