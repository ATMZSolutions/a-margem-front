import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { adaptarConfiguracoes } from './adaptadores.mjs';

const caminhos = ['src/components/home/Contato.tsx', 'src/app/contato/page.tsx', 'src/components/Sidebar.tsx', 'src/components/home/Main.tsx', 'src/components/home/Sobre.tsx', 'src/components/home/Agenda.tsx', 'src/components/Footer.tsx', 'src/app/layout.tsx', 'src/app/page.tsx', 'src/lib/siteContent.ts', 'next.config.ts'];
async function fontes() { return Promise.all(caminhos.map(async (caminho) => ({ caminho, codigo: await readFile(caminho, 'utf8') }))); }

describe('adaptadores das configurações atuais', () => {
  it('unifica contatos e preserva home, menu, SEO e redirecionamentos dinâmicos', async () => {
    const resultado = adaptarConfiguracoes(await fontes());
    expect(resultado.conflitos).toEqual([]);
    expect(resultado.contatos).toHaveLength(4);
    expect(resultado.contatos.every((item) => item.fontes.includes('src/lib/siteContent.ts'))).toBe(true);
    expect(resultado.menus).toHaveLength(10);
    expect(resultado.menus[0]).toMatchObject({ chaveOrigem: 'menu:/', rotulo: 'Home', ordem: 0 });
    expect(resultado.secoesHome.map((item) => item.chave)).toEqual(['main', 'agenda', 'sobre', 'contato']);
    expect(resultado.aliasesConfigurados).toHaveLength(10);
    expect(resultado.aliasesConfigurados[0]).toMatchObject({ origem: '/home/img1.jpg', destino: '/home/img1.webp' });
    const identidade = resultado.configuracoes.find((item) => item.chave === 'src/lib/siteContent.ts');
    expect(identidade.campos.find((item) => item.chave === 'seo').valor.dominio).toBe('https://www.amargem.com.br');
    expect(resultado.secoesHome.map((item) => ({ chave: item.chave, ordem: item.ordem }))).toEqual([
      { chave: 'main', ordem: 0 }, { chave: 'agenda', ordem: 1 }, { chave: 'sobre', ordem: 2 }, { chave: 'contato', ordem: 3 },
    ]);
    const homePadrao = resultado.configuracoes.find((item) => item.chave === 'home:pagina');
    expect(homePadrao.dados.sobre.texto).toContain('primeiro grupo de teatro hip-hop');
    expect(homePadrao.dados.sobre.acaoPrincipal.destino).toBe('/sobre');
  });
  it('sinaliza divergência entre contatos e bloqueia alterações de regra não suportadas', async () => {
    const arquivos = await fontes();
    const siteContent = arquivos.find((arquivo) => arquivo.caminho === 'src/lib/siteContent.ts');
    siteContent.codigo = siteContent.codigo.replace('  { tipo: "whatsapp", rotulo: "+55 (81) 9 8600-9096", url: "https://wa.me/5581986009096", ordem: 0, ativo: true },\n', '');
    expect(adaptarConfiguracoes(arquivos).conflitos).toContain('Fontes obrigatórias dos quatro contatos incompletas');
    arquivos.at(-1).codigo = arquivos.at(-1).codigo.replace('length: 9', 'length: 10');
    expect(() => adaptarConfiguracoes(arquivos)).toThrow('Regra dinâmica');
  });
  it('não avalia contatos com expressões executáveis e denuncia fontes incompletas', () => {
    expect(() => adaptarConfiguracoes([{ caminho: 'teste.tsx', codigo: 'const contacts = executar();' }])).toThrow('Contatos não literais');
    expect(adaptarConfiguracoes([]).conflitos).toContain('Fontes obrigatórias dos quatro contatos incompletas');
  });
});
