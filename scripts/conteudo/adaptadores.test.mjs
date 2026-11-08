import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { adaptarConfiguracoes } from './adaptadores.mjs';

const caminhos = ['src/components/home/Contato.tsx', 'src/app/contato/page.tsx', 'src/components/Sidebar.tsx', 'src/components/home/Main.tsx', 'src/components/home/Sobre.tsx', 'src/components/home/Agenda.tsx', 'src/components/Footer.tsx', 'src/app/layout.tsx', 'src/app/page.tsx', 'next.config.ts'];
async function fontes() { return Promise.all(caminhos.map(async (caminho) => ({ caminho, codigo: await readFile(caminho, 'utf8') }))); }

describe('adaptadores das configurações atuais', () => {
  it('unifica contatos e preserva home, menu, SEO e redirecionamentos dinâmicos', async () => {
    const resultado = adaptarConfiguracoes(await fontes());
    expect(resultado.conflitos).toEqual([]);
    expect(resultado.contatos).toHaveLength(4);
    expect(resultado.contatos.every((item) => item.fontes.length === 2)).toBe(true);
    expect(resultado.menus).toHaveLength(10);
    expect(resultado.aliasesConfigurados).toHaveLength(10);
    expect(resultado.aliasesConfigurados[0]).toMatchObject({ origem: '/home/img1.jpg', destino: '/home/img1.webp' });
    const layout = resultado.configuracoes.find((item) => item.chave === 'src/app/layout.tsx');
    expect(layout.campos.find((item) => item.chave === 'seo').valor.metadataBase).toBe('https://www.amargem.com.br');
    const home = resultado.configuracoes.find((item) => item.chave === 'src/app/page.tsx');
    expect(home.campos.find((item) => item.chave === 'ordem-secoes').valor).toEqual(['Main', 'AgendaHome', 'Sobre', 'Contato']);
    const sobre = resultado.configuracoes.find((item) => item.chave.endsWith('home/Sobre.tsx'));
    expect(sobre.campos.some((item) => item.tag === 'p' && item.valor.includes('primeiro grupo de teatro hip-hop'))).toBe(true);
    expect(sobre.campos.some((item) => item.valor === '/sobre')).toBe(true);
  });
  it('sinaliza divergência entre contatos e bloqueia alterações de regra não suportadas', async () => {
    const arquivos = await fontes();
    arquivos[0].codigo = arquivos[0].codigo.replace('+55 (81) 9 8600-9096', 'Outro número');
    expect(adaptarConfiguracoes(arquivos).conflitos[0]).toContain('Contato divergente');
    arquivos.at(-1).codigo = arquivos.at(-1).codigo.replace('length: 9', 'length: 10');
    expect(() => adaptarConfiguracoes(arquivos)).toThrow('Regra dinâmica');
  });
  it('não avalia contatos com expressões executáveis e denuncia fontes incompletas', () => {
    expect(() => adaptarConfiguracoes([{ caminho: 'teste.tsx', codigo: 'const contacts = executar();' }])).toThrow('Contatos não literais');
    expect(adaptarConfiguracoes([]).conflitos).toContain('Fontes obrigatórias dos quatro contatos incompletas');
  });
});
