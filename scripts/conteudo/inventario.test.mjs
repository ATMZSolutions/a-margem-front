import { describe, expect, it } from 'vitest';
import { normalizar } from './inventario.mjs';

const integrantes = [{ id: 'bento', nome: 'Francisco Bento', image: '/coletivo/bento.webp', fichaTecnica: 'Ficha', biografia: 'Bio' }];

function fontes({ listaLegada = integrantes, paginaLeitor = false, fonteFallback = false } = {}) {
  return [
    { caminho: 'src/data/integrantes.ts', variaveis: [{ nome: 'integrantes', valor: integrantes }], textos: [] },
    {
      caminho: 'src/app/coletivo/page.tsx',
      variaveis: listaLegada === null ? [] : [{ nome: 'integrantes', valor: listaLegada }],
      textos: paginaLeitor ? [{ valor: '@/lib/publicContent' }] : [],
    },
    { caminho: 'src/lib/publicContent.ts', variaveis: [], textos: fonteFallback ? [{ valor: '@/data/integrantes' }] : [] },
    { caminho: 'src/data/espetaculos.ts', variaveis: [{ nome: 'shows', valor: [] }, { nome: 'espetaculosData', valor: [] }], textos: [] },
    { caminho: 'src/data/premios.ts', variaveis: [{ nome: 'premios', valor: [] }], textos: [] },
    { caminho: 'src/data/projetos.ts', variaveis: [{ nome: 'projectImgs', valor: [] }], textos: [] },
  ];
}

describe('inventário de integrantes', () => {
  it('preserva o modo legado quando a página contém uma lista literal própria', () => {
    const lista = [{ id: 'bento', nome: 'Francisco Bento', image: '/coletivo/bento.webp' }];
    const resultado = normalizar(fontes({ listaLegada: lista }));
    expect(resultado.integrantes).toEqual([{ chaveOrigem: 'integrante:bento', ordem: 0, ...integrantes[0] }]);
    expect(resultado.conflitos).toEqual([]);
  });

  it('usa a fonte compartilhada quando a rota lê a listagem pública com fallback legado', () => {
    const resultado = normalizar(fontes({ listaLegada: null, paginaLeitor: true, fonteFallback: true }));
    expect(resultado.integrantes).toEqual([{ chaveOrigem: 'integrante:bento', ordem: 0, ...integrantes[0] }]);
    expect(resultado.conflitos).toEqual([]);
  });

  it('bloqueia a extração se a rota dinâmica não estiver ligada à fonte legado conhecida', () => {
    expect(() => normalizar(fontes({ listaLegada: null, paginaLeitor: true })))
      .toThrow('Fonte de integrantes não vinculada');
  });
});
