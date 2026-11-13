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

const rodar = (codigo, caminho = 'x.tsx') => adaptarConfiguracoes([{ caminho, codigo }]);
const campos = (codigo, caminho = 'x.tsx') => rodar(codigo, caminho).configuracoes.find((item) => item.chave === caminho)?.campos ?? [];
const SITE = 'src/lib/siteContent.ts';

describe('adaptadores: contatos', () => {
  const contato = (icone, extra = "text: 'a', link: 'mailto:a@b.c'") => `const contacts = [{ icon: ${icone}, ${extra} }];`;
  it('registra contatos válidos, inclusive links via new URL e fontes repetidas', () => {
    const arquivos = [
      { caminho: 'a.tsx', codigo: contato('<Mail />', "text: 'a', link: new URL('mailto:a@b.c')") },
      { caminho: 'b.tsx', codigo: contato('<Mail />') },
      { caminho: 'c.tsx', codigo: contato('<Mail />', "text: 'outro', link: 'mailto:a@b.c'") },
    ];
    const resultado = adaptarConfiguracoes(arquivos);
    expect(resultado.contatos[0].fontes).toEqual(['a.tsx', 'b.tsx']);
    expect(resultado.conflitos).toContain('Contato divergente: email em c.tsx');
  });
  it('rejeita contatos mal formados', () => {
    expect(() => rodar('const contacts = [1];')).toThrow('Contato inválido');
    expect(() => rodar('const contacts = [{ ...a }];')).toThrow('Contato dinâmico');
    expect(() => rodar("const contacts = [{ text: 'a' }];")).toThrow('Ícone de contato não suportado');
    expect(() => rodar(contato('<Mail></Mail>'))).toThrow('Ícone de contato não suportado');
    expect(() => rodar(contato('<Outro />'))).toThrow('Tipo de contato desconhecido');
    expect(() => rodar(contato('<Mail />', "text: 'a', link: 'ftp://a.b'"))).toThrow('Protocolo de contato inválido');
    expect(() => rodar('const contacts;')).toThrow('Contatos não literais');
  });
});

describe('adaptadores: siteContent', () => {
  it('lê padrões com valores explícitos e implícitos e valida completude', () => {
    const codigo = `
      const CONTATOS_PADRAO = [
        { tipo: 'whatsapp', rotulo: 'w', url: 'https://wa.me/1', ordem: 3 },
        { tipo: 'whatsapp', rotulo: 'w', url: 'https://wa.me/1', ordem: 3 },
        { tipo: 'email', rotulo: 'e', url: 'mailto:a@b.c' },
      ];
      const MENU_PADRAO = [{ rotulo: 'a', destino: '/a', ordem: 5, ativo: false }, { rotulo: 'b', destino: '/b' }, { rotulo: 'c' }];
      const SECOES_PADRAO = [{ chave: 'a', titulo: 't', ativa: false, ordem: 2 }, { chave: 'b', titulo: 't' }];
      const DEFAULT_IDENTITY = { nome: 'n' };
      const DEFAULT_CONTACT_PAGE = { t: 1 };
      const DEFAULT_HOME = { intervaloSlidesMs: 1, slides: [], logoHero: 'l', agenda: {}, sobre: {} };
      const { a } = b;
      const OUTRA = 1;
    `;
    const resultado = rodar(codigo, SITE);
    expect(resultado.contatos[0].fontes).toHaveLength(2);
    expect(resultado.menus[0]).toMatchObject({ ordem: 5, ativo: false });
    expect(resultado.menus[1]).toMatchObject({ ordem: 1, ativo: true });
    expect(resultado.secoesHome).toEqual([{ chave: 'a', titulo: 't', ativa: false, ordem: 2 }, { chave: 'b', titulo: 't', ativa: true, ordem: 1 }]);
    expect(resultado.conflitos).toEqual(expect.arrayContaining(['Menu padrão incompleto', 'Seções padrão da home incompletas', 'Fontes obrigatórias dos quatro contatos incompletas']));
    expect(resultado.configuracoes.find((item) => item.chave === 'home:pagina').dados.hero.logo).toBe('l');
    expect(resultado.configuracoes.find((item) => item.chave === 'contato:pagina').dados).toEqual({ t: 1 });
  });
  it('reconhece seções completas e rejeita padrões não literais', () => {
    const secoes = ['a', 'b', 'c', 'd'].map((chave) => `{ chave: '${chave}', titulo: 't' }`).join(',');
    expect(rodar(`const SECOES_PADRAO = [${secoes}];`, SITE).conflitos).not.toContain('Seções padrão da home incompletas');
    expect(rodar("const SECOES_PADRAO = [{ chave: 1, titulo: 't' }];", SITE).conflitos).toContain('Seções padrão da home incompletas');
    expect(() => rodar('const CONTATOS_PADRAO = 1;', SITE)).toThrow('Contatos padrão não literais');
    expect(() => rodar('const MENU_PADRAO = 1;', SITE)).toThrow('Menu padrão não literal');
    expect(() => rodar('const SECOES_PADRAO = 1;', SITE)).toThrow('Seções da home padrão não literais');
    expect(() => rodar("const CONTATOS_PADRAO = [{ tipo: 'x', rotulo: 'a', url: 'https://a.b' }];", SITE)).toThrow('Tipo de contato desconhecido');
    expect(rodar("const CONTATOS_PADRAO = [{ tipo: 'tiktok', rotulo: 'a', url: 'https://a.b' }];", SITE).contatos[0].tipo).toBe('tiktok');
  });
  it('lê menuItems e metadata', () => {
    const resultado = rodar("const menuItems = [{ href: '/', label: 'Home' }]; export const metadata = { title: 't' };");
    expect(resultado.menus[0]).toMatchObject({ chaveOrigem: 'menu:/', ordem: 0 });
    expect(resultado.configuracoes[0].campos).toEqual([{ chave: 'seo', valor: { title: 't' } }]);
  });
});

describe('adaptadores: avaliação de literais', () => {
  const meta = (expressao, pre = '') => rodar(`${pre} const metadata = ${expressao};`).configuracoes[0].campos[0].valor;
  it('resolve constantes, mapeamentos, templates e wrappers', () => {
    expect(meta('a', 'const a = { x: [1, true] };')).toEqual({ x: [1, true] });
    expect(meta('(1 as number)')).toBe(1);
    expect(meta('`a${1}b${"c"}`')).toBe('a1bc');
    expect(meta('`solo`')).toBe('solo');
    expect(meta('[1, 2].map((i) => ({ v: i, w: `x${i}` }))')).toEqual([{ v: 1, w: 'x1' }, { v: 2, w: 'x2' }]);
    expect(meta('[1].map((i) => ({ v: i }))', '')).toEqual([{ v: 1 }]);
    expect(meta('new URL("https://a.b")')).toBe('https://a.b');
  });
  it('rejeita expressões dinâmicas', () => {
    expect(() => meta('a', 'const a = b; const b = a;')).toThrow('Referência circular');
    expect(() => meta('{ ...a }')).toThrow('Objeto dinâmico');
    expect(() => meta('{ [k]: 1 }')).toThrow('Objeto dinâmico');
    expect(() => meta('`a${null}`')).toThrow('Interpolação dinâmica');
    expect(() => meta('`a${{}}`')).toThrow('Interpolação dinâmica');
    expect(() => meta('`a${u}`')).toThrow('Expressão não literal');
    expect(() => meta('[1].map((i) => i)')).toThrow('Mapeamento não literal');
    expect(() => meta('[1].map((i) => { return 1; })')).toThrow('Mapeamento não literal');
    expect(() => meta('[1].map((i, j) => ({}))')).toThrow('Expressão não literal');
    expect(() => meta('[1].map(({ a }) => ({}))')).toThrow('Expressão não literal');
    expect(() => meta('[1].map(f)')).toThrow('Expressão não literal');
    expect(() => meta('a.map((i) => ({}))')).toThrow('Expressão não literal');
    expect(() => meta('f()')).toThrow('Expressão não literal');
    expect(() => meta('new URL(a, b)')).toThrow('Expressão não literal');
    expect(() => meta('new URL')).toThrow('Expressão não literal');
    expect(() => meta('new Outro("x")')).toThrow('Expressão não literal');
  });
});

describe('adaptadores: JSX e chamadas', () => {
  it('captura textos simples e ignora conteúdo composto', () => {
    const resultado = campos("const x = <section><p> Olá   mundo </p><p>{'a'}{}<br />b</p><div>x</div><p><b>y</b></p><p><img /></p><p>{z}</p><p> </p></section>;");
    expect(resultado.filter((item) => item.chave.startsWith('texto:')).map((item) => item.valor)).toEqual(['Olá mundo', 'a b']);
  });
  it('captura div apenas no Footer', () => {
    expect(campos('const x = <div>Rodapé</div>;', 'src/components/Footer.tsx')[0]).toMatchObject({ tag: 'div', valor: 'Rodapé' });
    expect(campos('const x = <div>Rodapé</div>;', 'src/components/Outro.tsx')).toEqual([]);
  });
  it('avalia atributos suportados e descarta dinâmicos', () => {
    const resultado = campos("const x = <><img src=\"a\" alt={'b'} topButton style={{ a: 1 }} href={dyn()} label={} /><a {...p} href=\"/h\" /><span id=\"s\" /></>;");
    expect(resultado.filter((item) => item.chave.startsWith('elemento:')).map((item) => item.valor)).toEqual([
      { src: 'a', alt: 'b', topButton: true, style: { a: 1 } }, { href: '/h' },
    ]);
  });
  it('captura padrões, destinos, limites, tempos e classes', () => {
    const resultado = campos(`
      function F({ a = 1, b = dyn(), c }) {
        router.push('/a'); router.push(x); router.push(); router.push(1);
        v.slice(0, 2); v.slice(x); slice(1);
        setTimeout(f, 10); setInterval(f); setInterval(f, 'x'); outra(f, 1);
        return <div className="a b" id="1"><i className="a b" /><i className={cls} /><i className={'c'} /></div>;
      }`);
    const chaves = resultado.map((item) => item.chave.replace(/:\d+$/, ':n'));
    expect(chaves).toEqual(expect.arrayContaining(['padrao:a', 'destino:n', 'limites:n', 'tempo:n', 'classes-apresentacao']));
    expect(resultado.filter((item) => item.chave.startsWith('destino:'))).toHaveLength(1);
    expect(resultado.filter((item) => item.chave.startsWith('limites:'))).toHaveLength(1);
    expect(resultado.filter((item) => item.chave.startsWith('tempo:'))).toHaveLength(1);
    expect(resultado.find((item) => item.chave === 'classes-apresentacao').valor).toEqual(['a b']);
  });
  it('preserva CSS e ordem das seções da home', () => {
    expect(campos('body { margin: 0 }', 'a.css')[0]).toEqual({ chave: 'css-legado', valor: 'body { margin: 0 }' });
    expect(campos('const s = [{ component: <Main /> }, { component: <Sobre /> }, { outra: 1 }];', 'src/app/page.tsx')[0].valor).toEqual(['Main', 'Sobre']);
    expect(() => rodar('const s = [{ component: <A></A> }];', 'src/app/page.tsx')).toThrow('Seção da home não suportada');
  });
});

describe('adaptadores: next.config.ts', () => {
  const NEXT = 'next.config.ts';
  it('lê redirecionamentos estáticos', () => {
    const resultado = rodar("const c = { a: [{ source: '/a', destination: '/b', permanent: true }, { source: '/solto' }] };", NEXT);
    expect(resultado.aliasesConfigurados[0]).toEqual({ chaveOrigem: 'alias:/a', origem: '/a', destino: '/b', permanente: true });
  });
  it('bloqueia regras dinâmicas fora do formato esperado', () => {
    expect(() => rodar('const c = { source: `/home/img${index + 1}.jpg`, destination: "/b" };', NEXT)).toThrow('Regra dinâmica');
    expect(() => rodar('const c = { source: "/a", destination: `/home/img${index + 1}.webp` };', NEXT)).toThrow('Regra dinâmica');
    expect(() => rodar('const c = { source: `/home/img${index + 1}.jpg`, destination: `/home/img${index + 1}.webp` };', NEXT)).toThrow('Regra dinâmica');
  });
});
